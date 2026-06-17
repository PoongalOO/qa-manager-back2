import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './auth/permissions.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { FoldersModule } from './folders/folders.module';
import { CasesModule } from './cases/cases.module';
import { StepsModule } from './steps/steps.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { RunsModule } from './runs/runs.module';
import { RunCasesModule } from './runcases/runcases.module';
import { MembersModule } from './members/members.module';
import { TagsModule } from './tags/tags.module';
import { CaseTagsModule } from './casetags/casetags.module';
import { CommentsModule } from './comments/comments.module';
import { HomeModule } from './home/home.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { Folder } from './entities/folder.entity';
import { Case } from './entities/case.entity';
import { Step } from './entities/step.entity';
import { CaseStep } from './entities/case-step.entity';
import { Attachment } from './entities/attachment.entity';
import { Tag } from './entities/tag.entity';
import { Run } from './entities/run.entity';
import { RunCase } from './entities/run-case.entity';
import { RunCaseResult } from './entities/run-case-result.entity';
import { Member } from './entities/member.entity';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        entities: [
          User, Project, Folder, Case, Step, CaseStep,
          Attachment, Tag, Run, RunCase, RunCaseResult,
          Member, Comment,
        ],
        synchronize: true,
        charset: 'utf8mb4',
      }),
    }),
    AuthModule,
    PermissionsModule,
    UsersModule,
    ProjectsModule,
    FoldersModule,
    CasesModule,
    StepsModule,
    AttachmentsModule,
    RunsModule,
    RunCasesModule,
    MembersModule,
    TagsModule,
    CaseTagsModule,
    CommentsModule,
    HomeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
