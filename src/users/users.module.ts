import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Member } from '../entities/member.entity';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project, Member]), AuthModule, PermissionsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
