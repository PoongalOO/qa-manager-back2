import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Folder } from '../entities/folder.entity';
import { Case } from '../entities/case.entity';
import { Run } from '../entities/run.entity';
import { RunCase } from '../entities/run-case.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Folder) private folderRepo: Repository<Folder>,
    @InjectRepository(Case) private caseRepo: Repository<Case>,
    @InjectRepository(Run) private runRepo: Repository<Run>,
    @InjectRepository(RunCase) private runCaseRepo: Repository<RunCase>,
  ) {}

  async getHome(projectId: number) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const folders = await this.folderRepo.find({ where: { projectId } });
    const foldersWithCases = await Promise.all(
      folders.map(async (folder) => {
        const cases = await this.caseRepo
          .createQueryBuilder('c')
          .leftJoinAndSelect('c.tags', 'tag')
          .where('c.folderId = :folderId', { folderId: folder.id })
          .getMany();
        return { ...folder, Cases: cases };
      }),
    );

    const runs = await this.runRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });

    const runsWithCases = await Promise.all(
      runs.map(async (run) => {
        const runCases = await this.runCaseRepo
          .createQueryBuilder('rc')
          .leftJoinAndSelect('rc.case', 'case')
          .where('rc.runId = :runId', { runId: run.id })
          .getMany();
        return { ...run, RunCases: runCases };
      }),
    );

    return {
      ...project,
      Folders: foldersWithCases,
      Runs: runsWithCases,
    };
  }
}
