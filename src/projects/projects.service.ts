import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Folder } from '../entities/folder.entity';
import { Member } from '../entities/member.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Member) private memberRepo: Repository<Member>,
    @InjectRepository(Folder) private folderRepo: Repository<Folder>,
  ) {}

  async findAll(user: User, onlyUserProjects?: boolean) {
    if (onlyUserProjects) {
      const memberProjects = await this.memberRepo.find({ where: { userId: user.id } });
      const memberProjectIds = memberProjects.map((m) => m.projectId);
      const qb = this.projectRepo
        .createQueryBuilder('p')
        .where('p.userId = :userId', { userId: user.id });
      if (memberProjectIds.length) {
        qb.orWhere('p.id IN (:...ids)', { ids: memberProjectIds });
      }
      return qb.getMany();
    }

    if (user.role === 0) {
      return this.projectRepo.createQueryBuilder('p').getMany();
    }

    const memberProjects = await this.memberRepo.find({ where: { userId: user.id } });
    const memberProjectIds = memberProjects.map((m) => m.projectId);

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .where('p.isPublic = :pub', { pub: true })
      .orWhere('p.userId = :userId', { userId: user.id });

    if (memberProjectIds.length) {
      qb.orWhere('p.id IN (:...ids)', { ids: memberProjectIds });
    }

    return qb.getMany();
  }

  async create(user: User, name: string, detail: string | undefined, isPublic: boolean) {
    const project = this.projectRepo.create({ name, detail, isPublic, userId: user.id });
    return this.projectRepo.save(project);
  }

  async findOne(projectId: number) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    // Include folders like the original Express response
    const folders = await this.folderRepo.find({ where: { projectId } });
    return { ...project, Folders: folders };
  }

  async update(projectId: number, data: Partial<Project>) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    Object.assign(project, data);
    return this.projectRepo.save(project);
  }

  async remove(projectId: number) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    await this.projectRepo.remove(project);
    return { message: 'Project deleted' };
  }
}
