import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('folders')
export class FoldersController {
  constructor(
    private readonly foldersService: FoldersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: User, @Query('projectId', ParseIntPipe) projectId: number) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    return this.foldersService.findAll(projectId);
  }

  @Post('clone')
  async clone(
    @CurrentUser() user: User,
    @Body() body: { folderIds: number[]; targetProjectId: number },
  ) {
    await this.permissionsService.verifyProjectDeveloper(body.targetProjectId, user);
    return this.foldersService.clone(body.folderIds, body.targetProjectId);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Body() body: { name: string; detail?: string; parentFolderId?: number },
  ) {
    await this.permissionsService.verifyProjectDeveloper(projectId, user);
    return this.foldersService.create(projectId, body.name, body.detail, body.parentFolderId);
  }

  @Put(':folderId')
  async update(
    @CurrentUser() user: User,
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() body: { name?: string; detail?: string; parentFolderId?: number },
  ) {
    await this.permissionsService.verifyProjectDeveloperFromFolderId(folderId, user);
    return this.foldersService.update(folderId, body);
  }

  @Delete(':folderId')
  async remove(@CurrentUser() user: User, @Param('folderId', ParseIntPipe) folderId: number) {
    await this.permissionsService.verifyProjectDeveloperFromFolderId(folderId, user);
    return this.foldersService.remove(folderId);
  }
}
