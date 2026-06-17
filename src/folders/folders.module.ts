import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { Folder } from '../entities/folder.entity';
import { Case } from '../entities/case.entity';
import { CaseStep } from '../entities/case-step.entity';
import { Step } from '../entities/step.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Folder, Case, CaseStep, Step]),
    PermissionsModule,
  ],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
