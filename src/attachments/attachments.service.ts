import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Attachment } from '../entities/attachment.entity';
import { Case } from '../entities/case.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment) private attachmentRepo: Repository<Attachment>,
    @InjectRepository(Case) private caseRepo: Repository<Case>,
  ) {}

  async create(parentCaseId: number, files: Express.Multer.File[]) {
    const caseItem = await this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.attachments', 'attachment')
      .where('c.id = :id', { id: parentCaseId })
      .getOne();
    if (!caseItem) throw new NotFoundException('Case not found');

    const created: Attachment[] = [];
    for (const file of files) {
      const attachment = this.attachmentRepo.create({
        filename: file.filename,
        title: file.originalname,
      });
      await this.attachmentRepo.save(attachment);
      caseItem.attachments.push(attachment);
      created.push(attachment);
    }

    await this.caseRepo.save(caseItem);
    return created;
  }

  async findById(id: number) {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  async remove(attachmentId: number) {
    const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'attachments', attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.attachmentRepo.remove(attachment);
    return { message: 'Attachment deleted' };
  }
}
