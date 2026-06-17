#!/usr/bin/env node
/**
 * Migrates data from the original SQLite database to MariaDB.
 * Run once after building the NestJS app (which creates the MariaDB schema).
 *
 * Usage: node scripts/migrate-sqlite-to-mariadb.js
 */

import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SQLITE_PATH = process.env.SQLITE_PATH || '/home/poongaloo/jsdocs/unittcms/backend/database/database.sqlite';

const MARIADB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
};

for (const key of ['DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Tables in dependency order (parents before children)
const TABLES = [
  'users',
  'projects',
  'folders',
  'cases',
  'steps',
  'caseSteps',
  'attachments',
  'caseAttachments',
  'tags',
  'caseTags',
  'runs',
  'runCases',
  'runCaseResults',
  'members',
  'comments',
];

// Map SQLite column names to MariaDB column names (camelCase from TypeORM)
const COLUMN_MAPS = {
  users: { avatar_path: 'avatarPath', created_at: 'createdAt', updated_at: 'updatedAt' },
  projects: { is_public: 'isPublic', user_id: 'userId', created_at: 'createdAt', updated_at: 'updatedAt' },
  folders: { parent_folder_id: 'parentFolderId', project_id: 'projectId', created_at: 'createdAt', updated_at: 'updatedAt' },
  cases: { automation_status: 'automationStatus', pre_conditions: 'preConditions', expected_results: 'expectedResults', folder_id: 'folderId', created_at: 'createdAt', updated_at: 'updatedAt' },
  steps: { created_at: 'createdAt', updated_at: 'updatedAt' },
  caseSteps: { case_id: 'caseId', step_id: 'stepId', step_no: 'stepNo', created_at: 'createdAt', updated_at: 'updatedAt' },
  attachments: { created_at: 'createdAt', updated_at: 'updatedAt' },
  caseAttachments: { case_id: 'caseId', attachment_id: 'attachmentId', created_at: 'createdAt', updated_at: 'updatedAt' },
  tags: { project_id: 'projectId', created_at: 'createdAt', updated_at: 'updatedAt' },
  caseTags: { case_id: 'caseId', tag_id: 'tagId', created_at: 'createdAt', updated_at: 'updatedAt' },
  runs: { project_id: 'projectId', created_at: 'createdAt', updated_at: 'updatedAt' },
  runCases: { run_id: 'runId', case_id: 'caseId', created_at: 'createdAt', updated_at: 'updatedAt' },
  runCaseResults: { run_case_id: 'runCaseId', user_id: 'userId', created_at: 'createdAt', updated_at: 'updatedAt' },
  members: { user_id: 'userId', project_id: 'projectId', created_at: 'createdAt', updated_at: 'updatedAt' },
  comments: { commentable_type: 'commentableType', commentable_id: 'commentableId', user_id: 'userId', created_at: 'createdAt', updated_at: 'updatedAt' },
};

// Actual SQLite table names (SQLite uses camelCase, but Attachments is capitalized)
const SQLITE_TABLE_NAMES = {
  attachments: 'Attachments',
};

// Columns to exclude per table (e.g. join tables without id/timestamps in MariaDB)
const EXCLUDE_COLUMNS = {
  caseAttachments: ['id', 'createdAt', 'updatedAt'],
  caseTags: ['id', 'createdAt', 'updatedAt'],
};

function toMySQLDatetime(val) {
  if (!val) return null;
  // SQLite stores as '2026-06-16 23:06:46.123 +00:00' or ISO strings
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

function mapRow(tableName, row) {
  const map = COLUMN_MAPS[tableName] || {};
  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    const newKey = map[key] || key;
    if (newKey === 'isPublic') {
      mapped[newKey] = value ? 1 : 0;
    } else if (newKey === 'createdAt' || newKey === 'updatedAt') {
      mapped[newKey] = toMySQLDatetime(value);
    } else {
      mapped[newKey] = value;
    }
  }
  return mapped;
}

async function migrate() {
  console.log('Opening SQLite database...');
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  console.log('Connecting to MariaDB...');
  const mariadb = await mysql.createConnection(MARIADB_CONFIG);

  try {
    // Disable FK checks during migration
    await mariadb.execute('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of TABLES) {
      const sqliteTable = SQLITE_TABLE_NAMES[table] || table;

      // Check if table exists in SQLite
      const tableExists = sqlite.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      ).get(sqliteTable);

      if (!tableExists) {
        console.log(`  [SKIP] ${table} (not found in SQLite as "${sqliteTable}")`);
        continue;
      }

      const rows = sqlite.prepare(`SELECT * FROM "${sqliteTable}"`).all();
      console.log(`  [${table}] ${rows.length} rows`);

      if (rows.length === 0) continue;

      // Truncate MariaDB table first
      await mariadb.execute(`TRUNCATE TABLE \`${table}\``);

      for (const row of rows) {
        const mapped = mapRow(table, row);
        const excludeCols = EXCLUDE_COLUMNS[table] || [];
        for (const col of excludeCols) delete mapped[col];
        const cols = Object.keys(mapped).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(mapped).map(() => '?').join(', ');
        const vals = Object.values(mapped);

        await mariadb.execute(
          `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
          vals
        );
      }

      console.log(`    ✓ Migrated ${rows.length} rows to ${table}`);
    }

    await mariadb.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration error:', err);
    await mariadb.execute('SET FOREIGN_KEY_CHECKS = 1');
    throw err;
  } finally {
    sqlite.close();
    await mariadb.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
