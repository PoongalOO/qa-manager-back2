import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RunCasesController } from './runcases.controller';
import { RunCasesService } from './runcases.service';
import { RunCase } from '../entities/run-case.entity';
import { RunCaseResult } from '../entities/run-case-result.entity';
import { Run } from '../entities/run.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([RunCase, RunCaseResult, Run]), PermissionsModule],
  controllers: [RunCasesController],
  providers: [RunCasesService],
})
export class RunCasesModule {}
