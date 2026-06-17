import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, ManyToMany, JoinTable, JoinColumn, OneToMany
} from 'typeorm';
import { Folder } from './folder.entity';
import { Attachment } from './attachment.entity';
import { Tag } from './tag.entity';
import { CaseStep } from './case-step.entity';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: 0 })
  state: number;

  @Column({ default: 0 })
  priority: number;

  @Column({ default: 0 })
  type: number;

  @Column({ default: 0 })
  automationStatus: number;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 0 })
  template: number;

  @Column({ nullable: true, type: 'text' })
  preConditions: string;

  @Column({ nullable: true, type: 'text' })
  expectedResults: string;

  @Column()
  folderId: number;

  @ManyToOne(() => Folder, (f) => f.cases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folderId' })
  folder: Folder;

  @OneToMany(() => CaseStep, (cs) => cs.caseId)
  caseSteps: CaseStep[];

  @ManyToMany(() => Attachment, { cascade: true })
  @JoinTable({ name: 'caseAttachments', joinColumn: { name: 'caseId' }, inverseJoinColumn: { name: 'attachmentId' } })
  attachments: Attachment[];

  @ManyToMany(() => Tag, { cascade: false })
  @JoinTable({ name: 'caseTags', joinColumn: { name: 'caseId' }, inverseJoinColumn: { name: 'tagId' } })
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
