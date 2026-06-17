import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from '../entities/comment.entity';
import { RunCase } from '../entities/run-case.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, RunCase]), PermissionsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
