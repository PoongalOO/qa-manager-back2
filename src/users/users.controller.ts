import {
  Controller, Get, Post, Put, Delete, Body, Query, Param,
  ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UsersService } from './users.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser, Public } from '../auth/decorators';
import { User } from '../entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Public()
  @Post('signin')
  signIn(@Body() body: { email: string; password: string }) {
    return this.usersService.signIn(body.email, body.password);
  }

  @Public()
  @Post('signup')
  signUp(@Body() body: { email: string; password: string; username: string }) {
    return this.usersService.signUp(body.email, body.password, body.username);
  }

  @Public()
  @Get('authsettings')
  authSettings() {
    return this.usersService.getAuthSettings();
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    this.permissionsService.verifyAdmin(user);
    return this.usersService.findAll();
  }

  // Must be before any dynamic :userId routes
  @Get('me/roles')
  getMyRoles(@CurrentUser() user: User) {
    return this.usersService.getMyRoles(user.id);
  }

  @Get('find/:userId')
  findById(@Param('userId', ParseIntPipe) userId: number) {
    return this.usersService.findById(userId);
  }

  @Get('search')
  search(@Query('search') search: string, @Query('keyword') keyword: string) {
    return this.usersService.search(search || keyword || '');
  }

  @Post('admin-create')
  async adminCreate(
    @CurrentUser() user: User,
    @Body() body: { email: string; password: string; username: string; role: number },
  ) {
    this.permissionsService.verifyAdminOrQaManager(user);
    return this.usersService.adminCreate(body.email, body.password, body.username, body.role);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './public/uploads/avatars',
        filename: (req, file, cb) => {
          const user = (req as any).user as User;
          const ext = path.extname(file.originalname);
          const filename = `avatar_${user.id}_${Date.now()}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async updateAvatar(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const avatarPath = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(user.id, avatarPath);
  }

  @Delete('avatar')
  deleteAvatar(@CurrentUser() user: User) {
    return this.usersService.deleteAvatar(user.id);
  }

  @Put('password')
  updatePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.updatePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Put('username')
  updateUsername(@CurrentUser() user: User, @Body() body: { username: string }) {
    return this.usersService.updateUsername(user.id, body.username);
  }

  @Put('locale')
  updateLocale(@CurrentUser() user: User, @Body() body: { locale: string }) {
    return this.usersService.updateLocale(user.id, body.locale);
  }

  // Admin: set role for another user
  @Put(':userId/role')
  async updateRole(
    @CurrentUser() user: User,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { newRole: number },
  ) {
    this.permissionsService.verifyAdmin(user);
    return this.usersService.updateRole(userId, body.newRole);
  }

  // Admin: reset another user's password
  @Put(':userId/password')
  async adminResetPassword(
    @CurrentUser() user: User,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { newPassword: string },
  ) {
    this.permissionsService.verifyAdmin(user);
    return this.usersService.adminResetPassword(userId, body.newPassword);
  }

  // Admin: delete another user's account
  @Delete(':userId')
  async deleteUser(
    @CurrentUser() user: User,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    this.permissionsService.verifyAdmin(user);
    return this.usersService.deleteUser(userId);
  }
}
