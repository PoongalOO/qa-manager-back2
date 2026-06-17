import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  username: string;

  @Column({ default: 1 })
  role: number; // 0=administrator, 1=user, 2=qa-manager

  @Column({ nullable: true, type: 'varchar', length: 255 })
  avatarPath: string | null;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  locale: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
