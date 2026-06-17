import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { Project } from './project.entity';
import { Case } from './case.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  detail: string;

  @Column({ nullable: true })
  parentFolderId: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, (p) => p.folders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => Folder, (f) => f.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentFolderId' })
  parentFolder: Folder;

  @OneToMany(() => Folder, (f) => f.parentFolder)
  children: Folder[];

  @OneToMany(() => Case, (c) => c.folder)
  cases: Case[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
