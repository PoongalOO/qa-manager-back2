import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RunCase } from '../entities/run-case.entity';
import { RunCaseResult } from '../entities/run-case-result.entity';
import { Run } from '../entities/run.entity';

const RUN_STATE_FINISHED = 4; // Terminé: locked for everyone except managers
const RUN_STATE_CLOSED = 5; // Clôturé: locked for reporters only

export interface RunCaseUpdate {
  id: number;
  caseId: number;
  status: number;
  editState: 'notChanged' | 'changed' | 'new' | 'deleted';
}

export interface MyResultUpdate {
  runCaseId: number;
  status: number;
}

@Injectable()
export class RunCasesService {
  constructor(
    @InjectRepository(RunCase) private runCaseRepo: Repository<RunCase>,
    @InjectRepository(RunCaseResult) private runCaseResultRepo: Repository<RunCaseResult>,
    @InjectRepository(Run) private runRepo: Repository<Run>,
  ) {}

  async findAll(runId: number) {
    return this.runCaseRepo
      .createQueryBuilder('rc')
      .leftJoinAndSelect('rc.case', 'case')
      .where('rc.runId = :runId', { runId })
      .orderBy('rc.createdAt', 'ASC')
      .getMany();
  }

  private async loadMutableRun(runId: number, isManager: boolean): Promise<Run> {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');
    if (!isManager && run.state === RUN_STATE_FINISHED) {
      throw new ForbiddenException('This run is finished and locked');
    }
    return run;
  }

  private async activateIfNew(run: Run): Promise<void> {
    if (run.state === 0) {
      run.state = 1;
      await this.runRepo.save(run);
    }
  }

  async updateRunCases(runId: number, updates: RunCaseUpdate[], isManager: boolean) {
    const run = await this.loadMutableRun(runId, isManager);

    for (const update of updates) {
      if (update.editState === 'new') {
        const existing = await this.runCaseRepo.findOne({
          where: { runId, caseId: update.caseId },
        });
        if (!existing) {
          const rc = this.runCaseRepo.create({
            runId,
            caseId: update.caseId,
            status: update.status ?? 0,
          });
          await this.runCaseRepo.save(rc);
        }
      } else if (update.editState === 'changed' && update.id) {
        const rc = await this.runCaseRepo.findOne({ where: { id: update.id } });
        if (rc) {
          rc.status = update.status;
          await this.runCaseRepo.save(rc);
        }
      } else if (update.editState === 'deleted' && update.id) {
        const rc = await this.runCaseRepo.findOne({ where: { id: update.id } });
        if (rc) await this.runCaseRepo.remove(rc);
      }
    }

    if (updates.length) await this.activateIfNew(run);
    return this.findAll(runId);
  }

  async updateMyResults(
    userId: number,
    runId: number,
    updates: MyResultUpdate[],
    isManager: boolean,
    isDeveloper: boolean,
  ) {
    const run = await this.loadMutableRun(runId, isManager);
    if (!isManager && run.state === RUN_STATE_CLOSED && !isDeveloper) {
      throw new ForbiddenException('This run is closed');
    }

    const runCases = await this.runCaseRepo.find({ where: { runId } });
    const validRunCaseIds = new Set(runCases.map(rc => rc.id));

    const results: RunCaseResult[] = [];
    for (const update of updates) {
      if (!validRunCaseIds.has(update.runCaseId)) continue;
      let result = await this.runCaseResultRepo.findOne({
        where: { runCaseId: update.runCaseId, userId },
      });
      if (result) {
        result.status = update.status;
      } else {
        result = this.runCaseResultRepo.create({
          runCaseId: update.runCaseId,
          userId,
          status: update.status,
        });
      }
      await this.runCaseResultRepo.save(result);
      results.push(result);
    }

    if (results.length) await this.activateIfNew(run);
    return results;
  }
}
