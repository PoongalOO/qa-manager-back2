import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity('runCaseResults')
export class RunCaseResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  runCaseId: number;

  @Column()
  userId: number;

  @Column({ default: 0 })
  status: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
