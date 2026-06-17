import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { Case } from '../entities/case.entity';
import { Folder } from '../entities/folder.entity';
import { CaseStep } from '../entities/case-step.entity';
import { Step } from '../entities/step.entity';
import { Tag } from '../entities/tag.entity';
import { RunCase } from '../entities/run-case.entity';
import { RunCaseResult } from '../entities/run-case-result.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Folder, CaseStep, Step, Tag, RunCase, RunCaseResult]),
    PermissionsModule,
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
