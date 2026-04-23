import { Injectable } from '@nestjs/common';
import type { Member } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string): Promise<Member[]> {
    return this.prisma.member.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  create(userId: string, name: string): Promise<Member> {
    return this.prisma.member.create({ data: { name, userId } });
  }

  findByIdAndUser(id: string, userId: string): Promise<Member | null> {
    return this.prisma.member.findFirst({ where: { id, userId } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.member.delete({ where: { id } });
  }
}