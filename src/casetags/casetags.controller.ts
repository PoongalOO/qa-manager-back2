import { Controller, Post, Body, Query, ParseIntPipe } from '@nestjs/common';
import { CaseTagsService } from './casetags.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('casetags')
export class CaseTagsController {
  constructor(
    private readonly caseTagsService: CaseTagsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post('update')
  async update(
    @CurrentUser() user: User,
    @Query('caseId', ParseIntPipe) caseId: number,
    @Body() body: { tagIds: number[] },
  ) {
    await this.permissionsService.verifyProjectDeveloperFromCaseId(caseId, user);
    return this.caseTagsService.editTags(caseId, body.tagIds);
  }
}
