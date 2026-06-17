import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Case } from '../entities/case.entity';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class CaseTagsService {
  constructor(
    @InjectRepository(Case) private caseRepo: Repository<Case>,
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
  ) {}

  async editTags(caseId: number, tagIds: number[]) {
    const caseItem = await this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.tags', 'tag')
      .where('c.id = :caseId', { caseId })
      .getOne();
    if (!caseItem) throw new NotFoundException('Case not found');

    const tags = tagIds.length ? await this.tagRepo.find({ where: { id: In(tagIds) } }) : [];
    caseItem.tags = tags;
    await this.caseRepo.save(caseItem);
    return caseItem.tags;
  }
}
