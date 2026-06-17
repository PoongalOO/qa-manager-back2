import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Run } from '../entities/run.entity';
import { RunCase } from '../entities/run-case.entity';
import { Project } from '../entities/project.entity';
import { Member } from '../entities/member.entity';

@Injectable()
export class RunsService {
  constructor(
    @InjectRepository(Run) private runRepo: Repository<Run>,
    @InjectRepository(RunCase) private runCaseRepo: Repository<RunCase>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Member) private memberRepo: Repository<Member>,
  ) {}

  async findAll(projectId: number) {
    return this.runRepo
      .createQueryBuilder('r')
      .addSelect(
        '(SELECT COUNT(*) FROM runCases rc WHERE rc.runId = r.id)',
        'r_caseCount',
      )
      .where('r.projectId = :projectId', { projectId })
      .orderBy('r.createdAt', 'DESC')
      .getRawAndEntities()
      .then(({ raw, entities }) =>
        entities.map((run, i) => ({
          ...run,
          caseCount: Number(raw[i]?.r_caseCount ?? 0),
        })),
      );
  }

  async findMy(userId: number) {
    const ownedProjects = await this.projectRepo.find({
      where: { userId },
      select: { id: true },
    });
    const memberships = await this.memberRepo.find({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = [
      ...new Set([
        ...ownedProjects.map((p) => p.id),
        ...memberships.map((m) => m.projectId),
      ]),
    ];

    if (projectIds.length === 0) return [];

    return this.runRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.project', 'project')
      .addSelect(
        '(SELECT COUNT(*) FROM runCases rc WHERE rc.runId = r.id)',
        'r_caseCount',
      )
      .where('r.projectId IN (:...projectIds)', { projectIds })
      .orderBy('r.projectId', 'ASC')
      .addOrderBy('r.id', 'ASC')
      .getRawAndEntities()
      .then(({ raw, entities }) =>
        entities.map((run, i) => ({
          ...run,
          caseCount: Number(raw[i]?.r_caseCount ?? 0),
        })),
      );
  }

  async create(projectId: number, data: Partial<Run>) {
    const run = this.runRepo.create({ ...data, projectId });
    return this.runRepo.save(run);
  }

  async findOne(runId: number) {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');

    const runCases = await this.runCaseRepo.find({ where: { runId } });
    const statusCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const rc of runCases) {
      statusCounts[rc.status] = (statusCounts[rc.status] || 0) + 1;
    }

    const counts = Object.entries(statusCounts).map(([status, count]) => ({
      status: Number(status),
      count: String(count),
    }));

    return { run, statusCounts: counts };
  }

  async update(runId: number, data: Partial<Run>) {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');
    Object.assign(run, data);
    return this.runRepo.save(run);
  }

  async remove(runId: number) {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');
    await this.runRepo.remove(run);
    return { message: 'Run deleted' };
  }

  async download(runIds: number[]) {
    const runs = await this.runRepo.find({ where: { id: In(runIds) } });
    const result: any[] = [];
    for (const run of runs) {
      const runCases = await this.runCaseRepo
        .createQueryBuilder('rc')
        .leftJoinAndSelect('rc.case', 'case')
        .where('rc.runId = :runId', { runId: run.id })
        .getMany();
      result.push({ ...run, runCases });
    }
    return result;
  }
}
