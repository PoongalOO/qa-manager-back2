import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Member } from '../entities/member.entity';
import { PermissionsModule } from '../auth/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Member]), PermissionsModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
