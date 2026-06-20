import { Controller, Get, Post, Body, Query, ParseIntPipe } from '@nestjs/common';
import { RunCasesService } from './runcases.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('runcases')
export class RunCasesController {
  constructor(
    private readonly runCasesService: RunCasesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: User, @Query('runId', ParseIntPipe) runId: number) {
    await this.permissionsService.verifyProjectVisibleFromRunId(runId, user);
    return this.runCasesService.findAll(runId);
  }

  @Post('update')
  async update(
    @CurrentUser() user: User,
    @Query('runId', ParseIntPipe) runId: number,
    @Body() body: any[],
  ) {
    await this.permissionsService.verifyProjectDeveloperFromRunId(runId, user);
    const projectId = await this.permissionsService.getProjectIdFromRunId(runId);
    const isManager = await this.permissionsService.isProjectManager(projectId, user);
    return this.runCasesService.updateRunCases(runId, body, isManager);
  }

  @Post('myresults')
  async myResults(
    @CurrentUser() user: User,
    @Query('runId', ParseIntPipe) runId: number,
    @Body() body: any[],
  ) {
    await this.permissionsService.verifyProjectReporterFromRunId(runId, user);
    const projectId = await this.permissionsService.getProjectIdFromRunId(runId);
    const isManager = await this.permissionsService.isProjectManager(projectId, user);
    const isDeveloper = await this.permissionsService.isProjectDeveloper(projectId, user);
    return this.runCasesService.updateMyResults(user.id, runId, body, isManager, isDeveloper);
  }
}
