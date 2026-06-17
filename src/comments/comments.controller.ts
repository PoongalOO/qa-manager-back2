import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';
import { RunCase } from '../entities/run-case.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly permissionsService: PermissionsService,
    @InjectRepository(RunCase) private runCaseRepo: Repository<RunCase>,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('commentableType') commentableType: string,
    @Query('commentableId', ParseIntPipe) commentableId: number,
    @Query('viewUserId') viewUserId: string,
  ) {
    let isManager = false;
    if (commentableType === 'RunCase') {
      const rc = await this.runCaseRepo.findOne({ where: { id: commentableId } });
      if (rc) {
        isManager = await this.permissionsService.isProjectManager(
          await this.permissionsService.getProjectIdFromRunId(rc.runId),
          user,
        );
      }
    }
    return this.commentsService.findAll(
      commentableType,
      commentableId,
      user,
      isManager,
      viewUserId ? parseInt(viewUserId) : undefined,
    );
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Query('commentableType') commentableType: string,
    @Query('commentableId', ParseIntPipe) commentableId: number,
    @Body() body: { content: string },
  ) {
    return this.commentsService.create(commentableType, commentableId, user.id, body.content);
  }

  @Put(':commentId')
  async update(
    @CurrentUser() user: User,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: { content: string },
  ) {
    return this.commentsService.update(commentId, user.id, body.content);
  }

  @Delete(':commentId')
  async remove(@CurrentUser() user: User, @Param('commentId', ParseIntPipe) commentId: number) {
    return this.commentsService.remove(commentId, user.id, user.role === 0);
  }
}
