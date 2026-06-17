import { Controller, Post, Body, Query, ParseIntPipe } from '@nestjs/common';
import { StepsService } from './steps.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('steps')
export class StepsController {
  constructor(
    private readonly stepsService: StepsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post('update')
  async update(
    @CurrentUser() user: User,
    @Query('caseId', ParseIntPipe) caseId: number,
    @Body() body: any[],
  ) {
    await this.permissionsService.verifyProjectDeveloperFromCaseId(caseId, user);
    return this.stepsService.updateSteps(caseId, body);
  }
}
