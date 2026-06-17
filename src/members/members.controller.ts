import {
  Controller, Get, Post, Put, Delete, Body, Query, ParseIntPipe
} from '@nestjs/common';
import { MembersService } from './members.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get('check')
  async check(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    return this.membersService.check(projectId, userId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
  ) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    return this.membersService.findAll(projectId);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    await this.permissionsService.verifyProjectManager(projectId, user);
    return this.membersService.create(projectId, userId);
  }

  // Angular calls PUT /members?userId=&projectId=&role=
  @Put()
  async update(
    @CurrentUser() user: User,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('role', ParseIntPipe) role: number,
  ) {
    await this.permissionsService.verifyProjectManager(projectId, user);
    return this.membersService.updateByUserProject(userId, projectId, role);
  }

  // Angular calls DELETE /members?userId=&projectId=
  @Delete()
  async remove(
    @CurrentUser() user: User,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('projectId', ParseIntPipe) projectId: number,
  ) {
    await this.permissionsService.verifyProjectManager(projectId, user);
    return this.membersService.removeByUserProject(userId, projectId);
  }
}
