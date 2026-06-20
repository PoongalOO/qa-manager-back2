import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, Res
} from '@nestjs/common';
import type { Response } from 'express';
import { RunsService } from './runs.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('runs')
export class RunsController {
  constructor(
    private readonly runsService: RunsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get('my')
  async findMy(@CurrentUser() user: User) {
    return this.runsService.findMy(user.id);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
  ) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    const runs = await this.runsService.findAll(projectId);
    if (await this.permissionsService.isProjectDeveloper(projectId, user)) return runs;
    return runs.filter((r) => r.state !== 5); // closed runs are hidden from reporters
  }

  @Post('download')
  async download(
    @CurrentUser() user: User,
    @Body() body: { runIds: number[] },
    @Res() res: Response,
  ) {
    const data = await this.runsService.download(body.runIds);
    (res as any).setHeader('Content-Type', 'application/json');
    (res as any).setHeader('Content-Disposition', 'attachment; filename="runs.json"');
    return (res as any).send(JSON.stringify(data, null, 2));
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Body() body: { name: string; configurations?: string; description?: string; state?: number },
  ) {
    await this.permissionsService.verifyProjectManager(projectId, user);
    return this.runsService.create(projectId, body);
  }

  @Get(':runId')
  async findOne(@CurrentUser() user: User, @Param('runId', ParseIntPipe) runId: number) {
    await this.permissionsService.verifyProjectVisibleFromRunId(runId, user);
    return this.runsService.findOne(runId);
  }

  @Put(':runId')
  async update(
    @CurrentUser() user: User,
    @Param('runId', ParseIntPipe) runId: number,
    @Body() body: any,
  ) {
    await this.permissionsService.verifyProjectManagerFromRunId(runId, user);
    return this.runsService.update(runId, body);
  }

  @Delete(':runId')
  async remove(@CurrentUser() user: User, @Param('runId', ParseIntPipe) runId: number) {
    await this.permissionsService.verifyProjectManagerFromRunId(runId, user);
    return this.runsService.remove(runId);
  }
}
