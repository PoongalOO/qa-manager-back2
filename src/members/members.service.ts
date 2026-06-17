import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member) private memberRepo: Repository<Member>,
  ) {}

  async findAll(projectId: number) {
    const members = await this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'user')
      .where('m.projectId = :projectId', { projectId })
      .getMany();
    return members.map(m => ({ ...m, User: (m as any).user }));
  }

  async create(projectId: number, userId: number) {
    const existing = await this.memberRepo.findOne({ where: { projectId, userId } });
    if (existing) throw new ConflictException('User is already a member');
    const member = this.memberRepo.create({ projectId, userId, role: 2 });
    return this.memberRepo.save(member);
  }

  async updateByUserProject(userId: number, projectId: number, role: number) {
    const member = await this.memberRepo.findOne({ where: { userId, projectId } });
    if (!member) throw new NotFoundException('Member not found');
    member.role = role;
    return this.memberRepo.save(member);
  }

  async removeByUserProject(userId: number, projectId: number) {
    const member = await this.memberRepo.findOne({ where: { userId, projectId } });
    if (!member) throw new NotFoundException('Member not found');
    await this.memberRepo.remove(member);
    return { message: 'Member removed' };
  }

  async check(projectId: number, userId: number) {
    const member = await this.memberRepo.findOne({ where: { projectId, userId } });
    return { isMember: !!member, member: member || null };
  }
}
