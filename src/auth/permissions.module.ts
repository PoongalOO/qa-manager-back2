import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { Project } from '../entities/project.entity';
import { Member } from '../entities/member.entity';
import { Folder } from '../entities/folder.entity';
import { Case } from '../entities/case.entity';
import { Run } from '../entities/run.entity';
import { RunCase } from '../entities/run-case.entity';
import { Comment } from '../entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Member, Folder, Case, Run, RunCase, Comment]),
  ],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
