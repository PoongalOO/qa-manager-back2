import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Folder } from '../entities/folder.entity';
import { Case } from '../entities/case.entity';
import { CaseStep } from '../entities/case-step.entity';
import { Step } from '../entities/step.entity';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder) private folderRepo: Repository<Folder>,
    @InjectRepository(Case) private caseRepo: Repository<Case>,
    @InjectRepository(CaseStep) private caseStepRepo: Repository<CaseStep>,
    @InjectRepository(Step) private stepRepo: Repository<Step>,
  ) {}

  async findAll(projectId: number) {
    return this.folderRepo.find({ where: { projectId } });
  }

  async create(projectId: number, name: string, detail?: string, parentFolderId?: number) {
    const folder = this.folderRepo.create({ name, detail, projectId, parentFolderId });
    return this.folderRepo.save(folder);
  }

  async findOne(folderId: number) {
    const folder = await this.folderRepo.findOne({ where: { id: folderId } });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async update(folderId: number, data: Partial<Folder>) {
    const folder = await this.findOne(folderId);
    Object.assign(folder, data);
    return this.folderRepo.save(folder);
  }

  async remove(folderId: number) {
    const folder = await this.findOne(folderId);
    await this.folderRepo.remove(folder);
    return { message: 'Folder deleted' };
  }

  async clone(folderIds: number[], targetProjectId: number) {
    const folders = await this.folderRepo.find({ where: { id: In(folderIds) } });
    const newFolders: Folder[] = [];

    for (const folder of folders) {
      const newFolder = await this.cloneFolder(folder, targetProjectId, null);
      newFolders.push(newFolder);
    }

    return newFolders;
  }

  private async cloneFolder(
    folder: Folder,
    targetProjectId: number,
    parentFolderId: number | null,
  ) {
    const newFolder = this.folderRepo.create({
      name: folder.name,
      detail: folder.detail,
      projectId: targetProjectId,
      parentFolderId: parentFolderId ?? undefined,
    });
    await this.folderRepo.save(newFolder);

    // Clone cases in this folder
    const cases = await this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.attachments', 'attachment')
      .leftJoinAndSelect('c.tags', 'tag')
      .where('c.folderId = :folderId', { folderId: folder.id })
      .getMany();

    for (const c of cases) {
      await this.cloneCase(c, newFolder.id);
    }

    // Clone child folders
    const children = await this.folderRepo.find({ where: { parentFolderId: folder.id } });
    for (const child of children) {
      await this.cloneFolder(child, targetProjectId, newFolder.id);
    }

    return newFolder;
  }

  private async cloneCase(c: Case, targetFolderId: number) {
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
      const newCaseStep = this.caseStepRepo.create({
        caseId: newCase.id,
        stepId: newStep.id,
        stepNo: cs.stepNo,
      });
      await this.caseStepRepo.save(newCaseStep);
    }

    return newCase;
  }
}
