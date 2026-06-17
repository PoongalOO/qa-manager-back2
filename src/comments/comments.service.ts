import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
  ) {}

  async findAll(
    commentableType: string,
    commentableId: number,
    currentUser: User,
    isManager: boolean,
    viewUserId?: number,
  ) {
    const qb = this.commentRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'user')
      .where('c.commentableType = :type', { type: commentableType })
      .andWhere('c.commentableId = :id', { id: commentableId });

    if (commentableType === 'RunCase') {
      if (isManager && viewUserId) {
        qb.andWhere('c.userId = :viewUserId', { viewUserId });
      } else if (!isManager) {
        qb.andWhere('c.userId = :userId', { userId: currentUser.id });
      }
    }

    const comments = await qb.orderBy('c.createdAt', 'ASC').getMany();

    return comments.map(c => ({
      ...c,
      User: c.user ? {
        id: c.user.id,
        username: c.user.username,
        email: c.user.email,
      } : null,
    }));
  }

  async create(
    commentableType: string,
    commentableId: number,
    userId: number,
    content: string,
  ) {
    const comment = this.commentRepo.create({
      commentableType,
      commentableId,
      userId,
      content,
    });
    return this.commentRepo.save(comment);
  }

  async update(commentId: number, userId: number, content: string) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Cannot edit others comments');
    comment.content = content;
    return this.commentRepo.save(comment);
  }

  async remove(commentId: number, userId: number, isAdmin: boolean) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!isAdmin && comment.userId !== userId) {
      throw new ForbiddenException('Cannot delete others comments');
    }
    await this.commentRepo.remove(comment);
    return { message: 'Comment deleted' };
  }
}
