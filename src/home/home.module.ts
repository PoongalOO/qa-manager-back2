import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { Project } from '../entities/project.entity';
import { Folder } from '../entities/folder.entity';
import { Case } from '../entities/case.entity';
import { Run } from '../entities/run.entity';
import { RunCase } from '../entities/run-case.entity';
import { RunCaseResult } from '../entities/run-case-result.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Folder, Case, Run, RunCase, RunCaseResult]), PermissionsModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
