import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { Run } from './run.entity';
import { Case } from './case.entity';
import { RunCaseResult } from './run-case-result.entity';

@Entity('runCases')
export class RunCase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  runId: number;

  @Column()
  caseId: number;

  @Column({ default: 0 })
  status: number; // 0=untested, 1=passed, 2=failed, 3=skipped, 4=blocked

  @ManyToOne(() => Run, (r) => r.runCases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: Run;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @OneToMany(() => RunCaseResult, (rcr) => rcr.runCaseId)
  results: RunCaseResult[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
