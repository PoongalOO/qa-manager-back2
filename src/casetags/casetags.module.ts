import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseTagsController } from './casetags.controller';
import { CaseTagsService } from './casetags.service';
import { Case } from '../entities/case.entity';
import { Tag } from '../entities/tag.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Tag]), PermissionsModule],
  controllers: [CaseTagsController],
  providers: [CaseTagsService],
})
export class CaseTagsModule {}
