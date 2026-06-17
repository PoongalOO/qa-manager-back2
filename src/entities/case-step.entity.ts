import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { Step } from './step.entity';

@Entity('caseSteps')
export class CaseStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  caseId: number;

  @Column()
  stepId: number;

  @Column({ default: 0 })
  stepNo: number;

  @ManyToOne(() => Step, (s) => s.caseSteps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stepId' })
  step: Step;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
