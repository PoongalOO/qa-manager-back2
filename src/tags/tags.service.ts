import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
  ) {}

  async findAll(projectId: number) {
    return this.tagRepo.find({ where: { projectId } });
  }

  async create(projectId: number, name: string) {
    const tag = this.tagRepo.create({ name, projectId });
    return this.tagRepo.save(tag);
  }

  async findOne(tagId: number) {
    const tag = await this.tagRepo.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  async update(tagId: number, name: string) {
    const tag = await this.findOne(tagId);
    tag.name = name;
    return this.tagRepo.save(tag);
  }

  async remove(tagId: number) {
    const tag = await this.findOne(tagId);
    await this.tagRepo.remove(tag);
    return { message: 'Tag deleted' };
  }
}
