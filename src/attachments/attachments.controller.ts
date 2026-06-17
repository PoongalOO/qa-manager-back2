import {
  Controller, Post, Delete, Get, Param, Query,
  ParseIntPipe, UseInterceptors, UploadedFiles, Res
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AttachmentsService } from './attachments.service';
import { PermissionsService } from '../auth/permissions.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../entities/user.entity';

function uniqueFilename(destination: string, filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = filename;
  let index = 1;
  while (fs.existsSync(path.join(destination, candidate))) {
    candidate = `${base}_${index}${ext}`;
    index++;
  }
  return candidate;
}

@Controller('attachments')
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: './public/uploads/attachments',
        filename: (req, file, cb) => {
          const dest = path.join(process.cwd(), 'public', 'uploads', 'attachments');
          const unique = uniqueFilename(dest, file.originalname);
          cb(null, unique);
        },
      }),
    }),
  )
  async create(
    @CurrentUser() user: User,
    @Query('parentCaseId', ParseIntPipe) parentCaseId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    await this.permissionsService.verifyProjectDeveloperFromCaseId(parentCaseId, user);
    return this.attachmentsService.create(parentCaseId, files);
  }

  @Delete(':attachmentId')
  async remove(
    @CurrentUser() user: User,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    return this.attachmentsService.remove(attachmentId);
  }

  // Angular calls GET /attachments/download/:attachmentId (by DB ID)
  @Get('download/:attachmentId')
  async download(
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Res() res: Response,
  ) {
    const attachment = await this.attachmentsService.findById(attachmentId);
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'attachments', attachment.filename);
    if (!fs.existsSync(filePath)) {
      return (res as any).status(404).json({ message: 'File not found' });
    }
    return (res as any).download(filePath, attachment.title || attachment.filename);
  }

  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'attachments', filename);
    if (!fs.existsSync(filePath)) {
      return (res as any).status(404).json({ message: 'File not found' });
    }
    return (res as any).sendFile(filePath);
  }
}
