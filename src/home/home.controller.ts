import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { HomeService } from './home.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('home')
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get(':projectId')
  async getHome(
    @CurrentUser() user: User,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    await this.permissionsService.verifyProjectVisible(projectId, user);
    return this.homeService.getHome(projectId);
  }
}
