import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('tags')
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
  ) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    return this.tagsService.findAll(projectId);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Query('projectId', ParseIntPipe) projectId: number,
    @Body() body: { name: string },
  ) {
    await this.permissionsService.verifyProjectDeveloper(projectId, user);
    return this.tagsService.create(projectId, body.name);
  }

  @Get(':tagId')
  async findOne(@CurrentUser() user: User, @Param('tagId', ParseIntPipe) tagId: number) {
    return this.tagsService.findOne(tagId);
  }

  @Put(':tagId')
  async update(
    @CurrentUser() user: User,
    @Param('tagId', ParseIntPipe) tagId: number,
    @Body() body: { name: string },
  ) {
    return this.tagsService.update(tagId, body.name);
  }

  @Delete(':tagId')
  async remove(@CurrentUser() user: User, @Param('tagId', ParseIntPipe) tagId: number) {
    return this.tagsService.remove(tagId);
  }
}
