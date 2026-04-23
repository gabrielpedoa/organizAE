import { Injectable } from '@nestjs/common';
import type { Category, Member, Transaction } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTransactions(where: Prisma.TransactionWhereInput): Promise<Array<Transaction & { member: Member; category: Category }>> {
    return this.prisma.transaction.findMany({
      where,
      include: { member: true, category: true },
    });
  }
}