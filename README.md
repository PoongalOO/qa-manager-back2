# QA Manager Backend

Backend NestJS de l'application QA Manager.

## Stack

- NestJS / TypeScript
- TypeORM
- MySQL / MariaDB
- JWT / Passport
- Jest

## Installation

```bash
npm install
cp .env.example .env
```

Renseigner ensuite les variables sensibles dans `.env`.
Le fichier `.env` est ignoré par Git et ne doit pas être commité.

## Configuration

Variables principales :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=change_me
DB_NAME=qa_manager
SECRET_KEY=change_me_to_a_long_random_secret
PORT=3000
FRONTEND_ORIGIN=http://localhost:4200
```

## Commandes

```bash
npm run build
npm test
npm run start:dev
npm run start:prod
```

## Scripts utilitaires

Les scripts dans `scripts/` lisent la configuration base de données depuis les variables d'environnement (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

Exemple :

```bash
DB_USER=... DB_PASSWORD=*** DB_NAME=... node scripts/migrate-sqlite-to-mariadb.js
```

## Sécurité Git

Le dépôt ignore notamment :

- `node_modules/`
- `dist/`, `coverage/`
- `.env` et `.env.*`, sauf `.env.example`
- bases locales (`*.sqlite`, `*.db`, `database/`, `data/`)
- fichiers uploadés ou générés (`uploads/`, `storage/`)
- clés et certificats (`*.pem`, `*.key`, `*.p12`, `*.pfx`)
