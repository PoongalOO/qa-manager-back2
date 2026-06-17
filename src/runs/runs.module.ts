import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';
import { Run } from '../entities/run.entity';
import { RunCase } from '../entities/run-case.entity';
import { Project } from '../entities/project.entity';
import { Member } from '../entities/member.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Run, RunCase, Project, Member]), PermissionsModule],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService],
})
export class RunsModule {}
