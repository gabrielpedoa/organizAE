import { Injectable } from '@nestjs/common';
import type { Category, Member, Transaction, TransactionRule, TransactionType } from '@prisma/client';
import { Prisma, TransactionRule as TransactionRulePrisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.TransactionWhereInput): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where,
      include: {
        member: true,
        category: true,
        rule: { select: { isVariable: true, ruleType: true, totalInstallments: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  create(data: Prisma.TransactionCreateInput): Promise<Transaction & { member: Member; category: Category }> {
    return this.prisma.transaction.create({
      data,
      include: { member: true, category: true },
    });
  }

  createMany(data: Prisma.TransactionCreateManyInput[]): Promise<{ count: number }> {
    return this.prisma.transaction.createMany({ data });
  }

  findByIdAndUser(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, member: { userId } } });
  }

  update(id: string, data: Prisma.TransactionUpdateInput): Promise<Transaction & { member: Member; category: Category }> {
    return this.prisma.transaction.update({
      where: { id },
      data,
      include: { member: true, category: true },
    });
  }

  delete(id: string): Promise<Transaction> {
    return this.prisma.transaction.delete({ where: { id } });
  }

  deleteMany(where: Prisma.TransactionWhereInput): Promise<{ count: number }> {
    return this.prisma.transaction.deleteMany({ where });
  }

  findRuleByIdAndUser(id: string, userId: string): Promise<TransactionRule | null> {
    return this.prisma.transactionRule.findFirst({ where: { id, userId } });
  }

  createRule(data: Prisma.TransactionRuleCreateInput): Promise<TransactionRule> {
    return this.prisma.transactionRule.create({ data });
  }

  findRules(userId: string, type?: TransactionType): Promise<TransactionRule[]> {
    return this.prisma.transactionRule.findMany({
      where: { userId, ...(type ? { type } : {}) },
      include: { member: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateRule(id: string, data: Prisma.TransactionRuleUpdateInput): Promise<TransactionRule> {
    return this.prisma.transactionRule.update({
      where: { id },
      data,
      include: { member: true, category: true },
    });
  }

  deleteRule(id: string): Promise<TransactionRule> {
    return this.prisma.transactionRule.delete({ where: { id } });
  }

  countPaidBudgetItemsBeyondInstallment(ruleId: string, totalInstallments: number): Promise<number> {
    return this.prisma.budgetItem.count({
      where: {
        ruleId,
        installmentNumber: { gt: totalInstallments },
        status: { in: ['PAID', 'RECEIVED'] },
      },
    });
  }

  findMemberForUser(memberId: string, userId: string): Promise<Member | null> {
    return this.prisma.member.findFirst({ where: { id: memberId, userId } });
  }

  findCategoryForUser(categoryId: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id: categoryId, userId } });
  }
}