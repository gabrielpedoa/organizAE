import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.member.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  create(userId: string, dto: CreateMemberDto) {
    return this.prisma.member.create({ data: { name: dto.name, userId } });
  }

  async remove(userId: string, id: string) {
    const member = await this.prisma.member.findFirst({ where: { id, userId } });
    if (!member) throw new NotFoundException();
    return this.prisma.member.delete({ where: { id } });
  }
}
