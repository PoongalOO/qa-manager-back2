import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RunCase } from '../entities/run-case.entity';
import { RunCaseResult } from '../entities/run-case-result.entity';

export interface RunCaseUpdate {
  caseId: number;
  status: number;
  editState: 'created' | 'updated' | 'deleted';
  runCaseId?: number;
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
  ) {}

  async findAll(runId: number) {
    return this.runCaseRepo
      .createQueryBuilder('rc')
      .leftJoinAndSelect('rc.case', 'case')
      .where('rc.runId = :runId', { runId })
      .orderBy('rc.createdAt', 'ASC')
      .getMany();
  }

  async updateRunCases(runId: number, updates: RunCaseUpdate[]) {
    for (const update of updates) {
      if (update.editState === 'created') {
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
      } else if (update.editState === 'updated' && update.runCaseId) {
        const rc = await this.runCaseRepo.findOne({ where: { id: update.runCaseId } });
        if (rc) {
          rc.status = update.status;
          await this.runCaseRepo.save(rc);
        }
      } else if (update.editState === 'deleted' && update.caseId) {
        const rc = await this.runCaseRepo.findOne({ where: { runId, caseId: update.caseId } });
        if (rc) await this.runCaseRepo.remove(rc);
      }
    }

    return this.findAll(runId);
  }

  async updateMyResults(userId: number, updates: MyResultUpdate[]) {
    const results: RunCaseResult[] = [];
    for (const update of updates) {
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
    return results;
  }
}
