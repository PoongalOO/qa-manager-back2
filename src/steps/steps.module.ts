import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { Step } from '../entities/step.entity';
import { CaseStep } from '../entities/case-step.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Step, CaseStep]), PermissionsModule],
  controllers: [StepsController],
  providers: [StepsService],
})
export class StepsModule {}
