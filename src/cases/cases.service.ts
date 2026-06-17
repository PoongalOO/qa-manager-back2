import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as path from 'path';
import { Case } from '../entities/case.entity';
import { Folder } from '../entities/folder.entity';
import { CaseStep } from '../entities/case-step.entity';
import { Step } from '../entities/step.entity';
import { Tag } from '../entities/tag.entity';
import { RunCase } from '../entities/run-case.entity';
import { RunCaseResult } from '../entities/run-case-result.entity';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case) private caseRepo: Repository<Case>,
    @InjectRepository(Folder) private folderRepo: Repository<Folder>,
    @InjectRepository(CaseStep) private caseStepRepo: Repository<CaseStep>,
    @InjectRepository(Step) private stepRepo: Repository<Step>,
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
    @InjectRepository(RunCase) private runCaseRepo: Repository<RunCase>,
    @InjectRepository(RunCaseResult) private runCaseResultRepo: Repository<RunCaseResult>,
  ) {}

  async findAll(folderId: number, search?: string, priority?: string, type?: string, tag?: string) {
    const qb = this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.tags', 'tag')
      .where('c.folderId = :folderId', { folderId });

    if (search) {
      qb.andWhere('c.title LIKE :search', { search: `%${search}%` });
    }
    if (priority !== undefined && priority !== '') {
      qb.andWhere('c.priority = :priority', { priority: parseInt(priority) });
    }
    if (type !== undefined && type !== '') {
      qb.andWhere('c.type = :type', { type: parseInt(type) });
    }
    if (tag !== undefined && tag !== '') {
      qb.andWhere('tag.id = :tagId', { tagId: parseInt(tag) });
    }

    return qb.getMany();
  }

  async create(folderId: number, data: Partial<Case>) {
    const c = this.caseRepo.create({ ...data, folderId });
    return this.caseRepo.save(c);
  }

  async findOne(caseId: number) {
    const caseItem = await this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.attachments', 'attachment')
      .leftJoinAndSelect('c.tags', 'tag')
      .where('c.id = :caseId', { caseId })
      .getOne();
    if (!caseItem) throw new NotFoundException('Case not found');

    // Fetch ordered steps
    const caseSteps = await this.caseStepRepo
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.step', 'step')
      .where('cs.caseId = :caseId', { caseId })
      .orderBy('cs.stepNo', 'ASC')
      .getMany();

    const steps = caseSteps.map(cs => ({
      ...cs.step,
      caseSteps: { stepNo: cs.stepNo },
    }));

    return { ...caseItem, steps };
  }

  async update(caseId: number, data: Partial<Case>) {
    const c = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!c) throw new NotFoundException('Case not found');
    Object.assign(c, data);
    return this.caseRepo.save(c);
  }

  async bulkDelete(caseIds: number[]) {
    await this.caseRepo.delete({ id: In(caseIds) });
    return { message: 'Cases deleted' };
  }

  async clone(caseIds: number[], targetFolderId: number) {
    const cases = await this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.attachments', 'attachment')
      .leftJoinAndSelect('c.tags', 'tag')
      .where('c.id IN (:...ids)', { ids: caseIds })
      .getMany();

    const newCases: Case[] = [];
    for (const c of cases) {
      const caseSteps = await this.caseStepRepo
        .createQueryBuilder('cs')
        .leftJoinAndSelect('cs.step', 'step')
        .where('cs.caseId = :caseId', { caseId: c.id })
        .orderBy('cs.stepNo', 'ASC')
        .getMany();

      const newCase = this.caseRepo.create({
        title: c.title,
        state: c.state,
        priority: c.priority,
        type: c.type,
        automationStatus: c.automationStatus,
        description: c.description,
        template: c.template,
        preConditions: c.preConditions,
        expectedResults: c.expectedResults,
        folderId: targetFolderId,
        attachments: c.attachments,
        tags: c.tags,
      });
      await this.caseRepo.save(newCase);

      for (const cs of caseSteps) {
        const newStep = this.stepRepo.create({ step: cs.step.step, result: cs.step.result });
        await this.stepRepo.save(newStep);
        await this.caseStepRepo.save(
          this.caseStepRepo.create({ caseId: newCase.id, stepId: newStep.id, stepNo: cs.stepNo })
        );
      }

      newCases.push(newCase);
    }

    return newCases;
  }

  async move(caseIds: number[], targetFolderId: number) {
    await this.caseRepo.update({ id: In(caseIds) }, { folderId: targetFolderId });
    return { message: 'Cases moved' };
  }

  async indexByProjectId(
    projectId: number,
    runId?: number,
    status?: number,
    tag?: string,
    search?: string,
    viewUserId?: number,
  ) {
    const folders = await this.folderRepo.find({ where: { projectId } });
    const folderIds = folders.map(f => f.id);

    if (!folderIds.length) return [];

    let runCaseMap: Map<number, RunCase> = new Map();
    let filteredCaseIds: number[] | null = null;

    if (runId) {
      const runCases = await this.runCaseRepo.find({ where: { runId } });
      if (!runCases.length) return [];

      for (const rc of runCases) {
        runCaseMap.set(rc.caseId, rc);
      }

      let targetRunCases = runCases;
      if (status !== undefined) {
        targetRunCases = runCases.filter(rc => rc.status === status);
      }
      filteredCaseIds = targetRunCases.map(rc => rc.caseId);
      if (!filteredCaseIds.length) return [];
    }

    const qb = this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.tags', 'tag')
      .where('c.folderId IN (:...folderIds)', { folderIds });

    if (filteredCaseIds !== null) {
      qb.andWhere('c.id IN (:...filteredCaseIds)', { filteredCaseIds });
    }

    if (tag) {
      qb.andWhere('tag.id = :tagId', { tagId: parseInt(tag) });
    }
    if (search) {
      qb.andWhere('c.title LIKE :search', { search: `%${search}%` });
    }

    const cases = await qb.getMany();

    if (viewUserId && runId) {
      for (const c of cases as any[]) {
        const rc = runCaseMap.get(c.id);
        if (rc) {
          c.runCaseResults = await this.runCaseResultRepo.find({
            where: { runCaseId: rc.id, userId: viewUserId },
          });
        } else {
          c.runCaseResults = [];
        }
      }
    }

    return cases;
  }

  async download(caseIds: number[]) {
    const cases = await this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.tags', 'tag')
      .leftJoinAndSelect('c.attachments', 'attachment')
      .where('c.id IN (:...ids)', { ids: caseIds })
      .getMany();

    const result: any[] = [];
    for (const c of cases) {
      const caseSteps = await this.caseStepRepo
        .createQueryBuilder('cs')
        .leftJoinAndSelect('cs.step', 'step')
        .where('cs.caseId = :caseId', { caseId: c.id })
        .orderBy('cs.stepNo', 'ASC')
        .getMany();
      result.push({
        ...c,
        steps: caseSteps.map(cs => ({ ...cs.step, stepNo: cs.stepNo })),
      });
    }

    return result;
  }

  async importCases(folderId: number, fileBuffer: Buffer, mimetype: string, originalname: string) {
    let cases: any[] = [];

    const ext = path.extname(originalname).toLowerCase();

    if (ext === '.json' || mimetype === 'application/json') {
      cases = JSON.parse(fileBuffer.toString());
    } else if (ext === '.csv' || mimetype === 'text/csv') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Papa = require('papaparse');
      const result = Papa.parse(fileBuffer.toString(), { header: true });
      cases = result.data;
    } else if (ext === '.xlsx' || mimetype.includes('spreadsheet')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileBuffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      cases = XLSX.utils.sheet_to_json(sheet);
    }

    const created: Case[] = [];
    for (const c of cases) {
      if (!c.title) continue;
      const newCase = this.caseRepo.create({
        title: c.title,
        state: c.state || 0,
        priority: c.priority || 0,
        type: c.type || 0,
        automationStatus: c.automationStatus || 0,
        description: c.description || '',
        template: c.template || 0,
        preConditions: c.preConditions || '',
        expectedResults: c.expectedResults || '',
        folderId,
      });
      await this.caseRepo.save(newCase);
      created.push(newCase);
    }

    return created;
  }
}
