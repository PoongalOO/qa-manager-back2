import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Step } from '../entities/step.entity';
import { CaseStep } from '../entities/case-step.entity';

export interface StepUpdate {
  step?: string;
  result?: string;
  editState: 'created' | 'updated' | 'deleted';
  caseSteps?: { stepNo: number };
  id?: number; // stepId for update/delete
}

@Injectable()
export class StepsService {
  constructor(
    @InjectRepository(Step) private stepRepo: Repository<Step>,
    @InjectRepository(CaseStep) private caseStepRepo: Repository<CaseStep>,
  ) {}

  async updateSteps(caseId: number, updates: StepUpdate[]) {
    for (const update of updates) {
      if (update.editState === 'created') {
        const newStep = this.stepRepo.create({
          step: update.step,
          result: update.result,
        });
        await this.stepRepo.save(newStep);

        const caseStep = this.caseStepRepo.create({
          caseId,
          stepId: newStep.id,
          stepNo: update.caseSteps?.stepNo ?? 0,
        });
        await this.caseStepRepo.save(caseStep);
      } else if (update.editState === 'updated' && update.id) {
        const step = await this.stepRepo.findOne({ where: { id: update.id } });
        if (step) {
          if (update.step !== undefined) step.step = update.step;
          if (update.result !== undefined) step.result = update.result;
          await this.stepRepo.save(step);
        }
        // Update stepNo if provided
        if (update.caseSteps?.stepNo !== undefined) {
          const cs = await this.caseStepRepo.findOne({ where: { caseId, stepId: update.id } });
          if (cs) {
            cs.stepNo = update.caseSteps.stepNo;
            await this.caseStepRepo.save(cs);
          }
        }
      } else if (update.editState === 'deleted' && update.id) {
        const cs = await this.caseStepRepo.findOne({ where: { caseId, stepId: update.id } });
        if (cs) await this.caseStepRepo.remove(cs);
        const step = await this.stepRepo.findOne({ where: { id: update.id } });
        if (step) await this.stepRepo.remove(step);
      }
    }

    // Return ordered steps for this case
    const caseSteps = await this.caseStepRepo
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.step', 'step')
      .where('cs.caseId = :caseId', { caseId })
      .orderBy('cs.stepNo', 'ASC')
      .getMany();

    return caseSteps.map(cs => ({
      ...cs.step,
      caseSteps: { stepNo: cs.stepNo },
    }));
  }
}
