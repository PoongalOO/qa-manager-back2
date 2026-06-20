import {
  Controller, Get, Post, Put, Body, Param, Query,
  ParseIntPipe, Res, UploadedFile, UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CasesService } from './cases.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('cases')
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get('byproject')
  async byproject(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('runId') runId: string,
    @Query('status') status: string,
    @Query('tag') tag: string,
    @Query('search') search: string,
    @Query('viewUserId') viewUserId: string,
  ) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    if (runId) await this.permissionsService.verifyProjectVisibleFromRunId(parseInt(runId), user);
    return this.casesService.indexByProjectId(
      projectId,
      runId ? parseInt(runId) : undefined,
      status !== undefined && status !== '' ? parseInt(status) : undefined,
      tag,
      search,
      viewUserId ? parseInt(viewUserId) : undefined,
    );
  }

  @Get('indexByProjectId')
  async indexByProjectId(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('runId') runId: string,
    @Query('status') status: string,
    @Query('tag') tag: string,
    @Query('search') search: string,
    @Query('viewUserId') viewUserId: string,
  ) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    if (runId) await this.permissionsService.verifyProjectVisibleFromRunId(parseInt(runId), user);
    return this.casesService.indexByProjectId(
      projectId,
      runId ? parseInt(runId) : undefined,
      status !== undefined && status !== '' ? parseInt(status) : undefined,
      tag,
      search,
      viewUserId ? parseInt(viewUserId) : undefined,
    );
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('folderId', ParseIntPipe) folderId: number,
    @Query('search') search: string,
    @Query('priority') priority: string,
    @Query('type') type: string,
    @Query('tag') tag: string,
  ) {
    await this.permissionsService.verifyProjectVisibleFromFolderId(folderId, user);
    return this.casesService.findAll(folderId, search, priority, type, tag);
  }

  @Post('bulkdelete')
  async bulkDelete(@CurrentUser() user: User, @Body() body: { caseIds: number[] }) {
    if (body.caseIds && body.caseIds.length > 0) {
      await this.permissionsService.verifyProjectDeveloperFromCaseId(body.caseIds[0], user);
    }
    return this.casesService.bulkDelete(body.caseIds);
  }

  @Post('clone')
  async clone(
    @CurrentUser() user: User,
    @Body() body: { caseIds: number[]; targetFolderId: number },
  ) {
    await this.permissionsService.verifyProjectDeveloperFromFolderId(body.targetFolderId, user);
    return this.casesService.clone(body.caseIds, body.targetFolderId);
  }

  @Put('move')
  async move(
    @CurrentUser() user: User,
    @Body() body: { caseIds: number[]; targetFolderId: number },
  ) {
    await this.permissionsService.verifyProjectDeveloperFromFolderId(body.targetFolderId, user);
    return this.casesService.move(body.caseIds, body.targetFolderId);
  }

  @Post('download')
  async download(
    @CurrentUser() user: User,
    @Body() body: { caseIds: number[] },
    @Res() res: Response,
  ) {
    const data = await this.casesService.download(body.caseIds);
    (res as any).setHeader('Content-Type', 'application/json');
    (res as any).setHeader('Content-Disposition', 'attachment; filename="cases.json"');
    return (res as any).send(JSON.stringify(data, null, 2));
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async importCases(
    @CurrentUser() user: User,
    @Query('folderId', ParseIntPipe) folderId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.permissionsService.verifyProjectDeveloperFromFolderId(folderId, user);
    return this.casesService.importCases(folderId, file.buffer, file.mimetype, file.originalname);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Query('folderId', ParseIntPipe) folderId: number,
    @Body() body: any,
  ) {
    await this.permissionsService.verifyProjectDeveloperFromFolderId(folderId, user);
    return this.casesService.create(folderId, body);
  }

  @Get(':caseId')
  async findOne(@CurrentUser() user: User, @Param('caseId', ParseIntPipe) caseId: number) {
    await this.permissionsService.verifyProjectVisibleFromCaseId(caseId, user);
    return this.casesService.findOne(caseId);
  }

  @Put(':caseId')
  async update(
    @CurrentUser() user: User,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() body: any,
  ) {
    await this.permissionsService.verifyProjectDeveloperFromCaseId(caseId, user);
    return this.casesService.update(caseId, body);
  }
}
