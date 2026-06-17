import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { CaseStep } from './case-step.entity';

@Entity('steps')
export class Step {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'text' })
  step: string;

  @Column({ nullable: true, type: 'text' })
  result: string;

  @OneToMany(() => CaseStep, (cs) => cs.step)
  caseSteps: CaseStep[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
