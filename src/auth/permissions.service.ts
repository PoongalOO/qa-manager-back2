import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Member } from '../entities/member.entity';
import { Folder } from '../entities/folder.entity';
import { Case } from '../entities/case.entity';
import { Run } from '../entities/run.entity';
import { RunCase } from '../entities/run-case.entity';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Member) private memberRepo: Repository<Member>,
    @InjectRepository(Folder) private folderRepo: Repository<Folder>,
    @InjectRepository(Case) private caseRepo: Repository<Case>,
    @InjectRepository(Run) private runRepo: Repository<Run>,
    @InjectRepository(RunCase) private runCaseRepo: Repository<RunCase>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
  ) {}

  isAdmin(user: User) { return user.role === 0; }
  isQaManager(user: User) { return user.role === 2; }
  isAdminOrQaManager(user: User) { return user.role === 0 || user.role === 2; }

  verifyAdmin(user: User) {
    if (!this.isAdmin(user)) throw new ForbiddenException('Admin only');
  }

  verifyAdminOrQaManager(user: User) {
    if (!this.isAdminOrQaManager(user)) throw new ForbiddenException('Admin or QA Manager only');
  }

  async getMemberRole(projectId: number, userId: number): Promise<number | null> {
    const member = await this.memberRepo.findOne({ where: { projectId, userId } });
    return member ? member.role : null;
  }

  async getProject(projectId: number): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  // Manager: owner OR member.role===0 OR admin
  async verifyProjectManager(projectId: number, user: User) {
    const project = await this.getProject(projectId);
    if (this.isAdmin(user)) return;
    if (project.userId === user.id) return;
    const memberRole = await this.getMemberRole(projectId, user.id);
    if (memberRole === 0) return;
    throw new ForbiddenException('Project manager access required');
  }

  // Developer: owner OR member.role in [0,1] OR admin/qa-manager
  async verifyProjectDeveloper(projectId: number, user: User) {
    const project = await this.getProject(projectId);
    if (this.isAdminOrQaManager(user)) return;
    if (project.userId === user.id) return;
    const memberRole = await this.getMemberRole(projectId, user.id);
    if (memberRole !== null && memberRole <= 1) return;
    throw new ForbiddenException('Project developer access required');
  }

  // Reporter: owner OR member.role in [0,1,2] OR admin/qa-manager
  async verifyProjectReporter(projectId: number, user: User) {
    const project = await this.getProject(projectId);
    if (this.isAdminOrQaManager(user)) return;
    if (project.userId === user.id) return;
    const memberRole = await this.getMemberRole(projectId, user.id);
    if (memberRole !== null && memberRole <= 2) return;
    throw new ForbiddenException('Project reporter access required');
  }

  // Visible: public OR owner OR member OR admin
  async verifyProjectVisible(projectId: number, user: User) {
    const project = await this.getProject(projectId);
    if (project.isPublic) return;
    if (this.isAdmin(user)) return;
    if (project.userId === user.id) return;
    const memberRole = await this.getMemberRole(projectId, user.id);
    if (memberRole !== null) return;
    throw new ForbiddenException('Access denied');
  }

  async getProjectIdFromFolderId(folderId: number): Promise<number> {
    const folder = await this.folderRepo.findOne({ where: { id: folderId } });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder.projectId;
  }

  async getProjectIdFromCaseId(caseId: number): Promise<number> {
    const c = await this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.folder', 'folder')
      .where('c.id = :caseId', { caseId })
      .getOne();
    if (!c) throw new NotFoundException('Case not found');
    return c.folder.projectId;
  }

  async getProjectIdFromRunId(runId: number): Promise<number> {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');
    return run.projectId;
  }

  async getProjectIdFromRunCaseId(runCaseId: number): Promise<number> {
    const rc = await this.runCaseRepo
      .createQueryBuilder('rc')
      .leftJoinAndSelect('rc.run', 'run')
      .where('rc.id = :runCaseId', { runCaseId })
      .getOne();
    if (!rc) throw new NotFoundException('RunCase not found');
    return rc.run.projectId;
  }

  async verifyProjectManagerFromFolderId(folderId: number, user: User) {
    const projectId = await this.getProjectIdFromFolderId(folderId);
    await this.verifyProjectManager(projectId, user);
  }

  async verifyProjectDeveloperFromFolderId(folderId: number, user: User) {
    const projectId = await this.getProjectIdFromFolderId(folderId);
    await this.verifyProjectDeveloper(projectId, user);
  }

  async verifyProjectReporterFromFolderId(folderId: number, user: User) {
    const projectId = await this.getProjectIdFromFolderId(folderId);
    await this.verifyProjectReporter(projectId, user);
  }

  async verifyProjectVisibleFromFolderId(folderId: number, user: User) {
    const projectId = await this.getProjectIdFromFolderId(folderId);
    await this.verifyProjectVisible(projectId, user);
  }

  async verifyProjectDeveloperFromCaseId(caseId: number, user: User) {
    const projectId = await this.getProjectIdFromCaseId(caseId);
    await this.verifyProjectDeveloper(projectId, user);
  }

  async verifyProjectReporterFromCaseId(caseId: number, user: User) {
    const projectId = await this.getProjectIdFromCaseId(caseId);
    await this.verifyProjectReporter(projectId, user);
  }

  async verifyProjectVisibleFromCaseId(caseId: number, user: User) {
    const projectId = await this.getProjectIdFromCaseId(caseId);
    await this.verifyProjectVisible(projectId, user);
  }

  async verifyProjectManagerFromRunId(runId: number, user: User) {
    const projectId = await this.getProjectIdFromRunId(runId);
    await this.verifyProjectManager(projectId, user);
  }

  async verifyProjectDeveloperFromRunId(runId: number, user: User) {
    const projectId = await this.getProjectIdFromRunId(runId);
    await this.verifyProjectDeveloper(projectId, user);
  }

  async verifyProjectReporterFromRunId(runId: number, user: User) {
    const projectId = await this.getProjectIdFromRunId(runId);
    await this.verifyProjectReporter(projectId, user);
  }

  // Closed (state 5) runs are hidden from reporters; developers and above still see them.
  async verifyProjectVisibleFromRunId(runId: number, user: User) {
    const run = await this.runRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');
    await this.verifyProjectVisible(run.projectId, user);
    if (run.state === 5 && !(await this.isProjectDeveloper(run.projectId, user))) {
      throw new ForbiddenException('This run is closed');
    }
  }

  async verifyProjectManagerFromRunCaseId(runCaseId: number, user: User) {
    const projectId = await this.getProjectIdFromRunCaseId(runCaseId);
    await this.verifyProjectManager(projectId, user);
  }

  async verifyProjectDeveloperFromRunCaseId(runCaseId: number, user: User) {
    const projectId = await this.getProjectIdFromRunCaseId(runCaseId);
    await this.verifyProjectDeveloper(projectId, user);
  }

  async isProjectManager(projectId: number, user: User): Promise<boolean> {
    try {
      await this.verifyProjectManager(projectId, user);
      return true;
    } catch {
      return false;
    }
  }

  async isProjectDeveloper(projectId: number, user: User): Promise<boolean> {
    try {
      await this.verifyProjectDeveloper(projectId, user);
      return true;
    } catch {
      return false;
    }
  }
}
