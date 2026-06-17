import {
  Injectable, ConflictException, UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Member } from '../entities/member.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Member) private memberRepo: Repository<Member>,
    private jwtService: JwtService,
  ) {}

  private toPublic(user: User) {
    const { password, ...pub } = user as any;
    return pub;
  }

  async signUp(email: string, password: string, username: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, password: hash, username, role: 1 });
    await this.userRepo.save(user);
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    return { access_token: token, expires_at: expiresAt, user: this.toPublic(user) };
  }

  async signIn(email: string, password: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    return { access_token: token, expires_at: expiresAt, user: this.toPublic(user) };
  }

  async findAll() {
    const users = await this.userRepo.find();
    return users.map(u => this.toPublic(u));
  }

  async findById(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.toPublic(user);
  }

  async search(keyword: string) {
    const users = await this.userRepo.find({
      where: [
        { email: Like(`%${keyword}%`) },
        { username: Like(`%${keyword}%`) },
      ],
    });
    return users.map(u => this.toPublic(u));
  }

  getAuthSettings() {
    return {
      roles: [
        { uid: 'administrator' },
        { uid: 'user' },
        { uid: 'qa-manager' },
      ],
      memberRoles: [
        { uid: 'manager' },
        { uid: 'developer' },
        { uid: 'reporter' },
      ],
      signUpEnabled: true,
    };
  }

  async adminCreate(email: string, password: string, username: string, role: number) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, password: hash, username, role });
    await this.userRepo.save(user);
    return { user: this.toPublic(user) };
  }

  async updatePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password incorrect');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { message: 'Password updated' };
  }

  async updateUsername(userId: number, username: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.username = username;
    await this.userRepo.save(user);
    return { user: this.toPublic(user) };
  }

  async adminResetPassword(targetUserId: number, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { user: this.toPublic(user) };
  }

  async updateLocale(userId: number, locale: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.locale = locale;
    await this.userRepo.save(user);
    return { user: this.toPublic(user) };
  }

  async updateAvatar(userId: number, avatarPath: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.avatarPath = avatarPath;
    await this.userRepo.save(user);
    return { user: this.toPublic(user) };
  }

  async deleteAvatar(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.avatarPath) {
      const filePath = path.join(process.cwd(), 'public', user.avatarPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      user.avatarPath = null;
      await this.userRepo.save(user);
    }
    return { user: this.toPublic(user) };
  }

  async updateRole(targetUserId: number, role: number) {
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    await this.userRepo.save(user);
    return { user: this.toPublic(user) };
  }

  async deleteUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 0) {
      const adminCount = await this.userRepo.count({ where: { role: 0 } });
      if (adminCount <= 1) {
        throw new ConflictException('At least one administrator is required');
      }
    }
    await this.userRepo.remove(user);
    return { message: 'User deleted' };
  }

  async getMyRoles(userId: number) {
    const ownedProjects = await this.projectRepo.find({
      where: { userId },
      select: { id: true },
    });
    const memberships = await this.memberRepo.find({ where: { userId } });

    const roles: { projectId: number; role: number; isOwner: boolean }[] = [];

    for (const p of ownedProjects) {
      const membership = memberships.find((m) => m.projectId === p.id);
      roles.push({
        projectId: p.id,
        role: membership ? membership.role : -1,
        isOwner: true,
      });
    }

    for (const m of memberships) {
      if (!roles.find((r) => r.projectId === m.projectId)) {
        roles.push({ projectId: m.projectId, role: m.role, isOwner: false });
      }
    }

    return roles;
  }
}
