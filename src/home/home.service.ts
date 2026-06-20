import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Folder } from '../entities/folder.entity';
import { Case } from '../entities/case.entity';
import { Run } from '../entities/run.entity';
import { RunCase } from '../entities/run-case.entity';
import { RunCaseResult } from '../entities/run-case-result.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Folder) private folderRepo: Repository<Folder>,
    @InjectRepository(Case) private caseRepo: Repository<Case>,
    @InjectRepository(Run) private runRepo: Repository<Run>,
    @InjectRepository(RunCase) private runCaseRepo: Repository<RunCase>,
    @InjectRepository(RunCaseResult) private runCaseResultRepo: Repository<RunCaseResult>,
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

        const runCaseIds = runCases.map((rc) => rc.id);
        const results = runCaseIds.length
          ? await this.runCaseResultRepo.find({ where: { runCaseId: In(runCaseIds) } })
          : [];
        const resultsByRunCase = new Map<number, { userId: number; status: number }[]>();
        for (const r of results) {
          const list = resultsByRunCase.get(r.runCaseId) ?? [];
          list.push({ userId: r.userId, status: r.status });
          resultsByRunCase.set(r.runCaseId, list);
        }

        const runCasesWithResults = runCases.map((rc) => ({
          ...rc,
          RunCaseResults: resultsByRunCase.get(rc.id) ?? [],
        }));

        return { ...run, RunCases: runCasesWithResults };
      }),
    );

    return {
      ...project,
      Folders: foldersWithCases,
      Runs: runsWithCases,
    };
  }
}
