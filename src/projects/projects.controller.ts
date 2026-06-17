import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('onlyUserProjects') onlyUserProjects: string,
  ) {
    return this.projectsService.findAll(user, onlyUserProjects === 'true');
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() body: { name: string; detail?: string; isPublic: boolean },
  ) {
    this.permissionsService.verifyAdminOrQaManager(user);
    return this.projectsService.create(user, body.name, body.detail, body.isPublic);
  }

  @Get(':projectId')
  async findOne(@CurrentUser() user: User, @Param('projectId', ParseIntPipe) projectId: number) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    return this.projectsService.findOne(projectId);
  }

  @Put(':projectId')
  async update(
    @CurrentUser() user: User,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: { name?: string; detail?: string; isPublic?: boolean },
  ) {
    await this.permissionsService.verifyProjectManager(projectId, user);
    return this.projectsService.update(projectId, body);
  }

  @Delete(':projectId')
  async remove(@CurrentUser() user: User, @Param('projectId', ParseIntPipe) projectId: number) {
    await this.permissionsService.verifyProjectManager(projectId, user);
    return this.projectsService.remove(projectId);
  }
}
