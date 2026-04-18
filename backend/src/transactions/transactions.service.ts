import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionRule, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateRuleDto } from './dto/create-rule.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, month?: string, memberId?: string, categoryId?: string, type?: string) {
    // consolidationId: null ensures transactions created by the consolidation flow
    // (confirmPayment / confirmReceipt) never appear here — they belong to the
    // Consolidação Mensal module exclusively.
    const where: Prisma.TransactionWhereInput = { member: { userId }, consolidationId: null };
    if (memberId) where.memberId = memberId;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type as TransactionType;
    if (month) {
      const [year, m] = month.split('-').map(Number);
      where.date = { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) };
    }
    return this.prisma.transaction.findMany({
      where,
      include: { member: true, category: true, rule: { select: { isVariable: true, ruleType: true, totalInstallments: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.validateOwnership(userId, dto.memberId, dto.categoryId);
    return this.prisma.transaction.create({
      data: { ...dto, date: new Date(dto.date) },
      include: { member: true, category: true },
    });
  }

  async createBulk(userId: string, dtos: CreateTransactionDto[]) {
    await Promise.all(dtos.map((dto) => this.validateOwnership(userId, dto.memberId, dto.categoryId)));
    await this.prisma.transaction.createMany({
      data: dtos.map((dto) => ({ ...dto, date: new Date(dto.date) })),
    });
    return { count: dtos.length };
  }

  async update(userId: string, id: string, dto: Partial<CreateTransactionDto>) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, member: { userId } } });
    if (!tx) throw new NotFoundException();
    const { date, ...rest } = dto;
    const updateData: Prisma.TransactionUpdateInput = {
      ...rest,
      ...(date ? { date: new Date(date) } : {}),
    };
    return this.prisma.transaction.update({ where: { id }, data: updateData, include: { member: true, category: true } });
  }

  async remove(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, member: { userId } } });
    if (!tx) throw new NotFoundException();
    return this.prisma.transaction.delete({ where: { id } });
  }

  async createRule(userId: string, dto: CreateRuleDto) {
    await this.validateOwnership(userId, dto.memberId, dto.categoryId);
    const rule = await this.prisma.transactionRule.create({
      data: {
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        memberId: dto.memberId,
        categoryId: dto.categoryId,
        userId,
        ruleType: dto.ruleType,
        recurrence: dto.recurrence,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        totalInstallments: dto.totalInstallments,
        isVariable: dto.isVariable ?? false,
        expenseType: dto.expenseType ?? null,
      },
    });
    await this.generateTransactions(rule);
    return rule;
  }

  listRules(userId: string, type?: string) {
    return this.prisma.transactionRule.findMany({
      where: { userId, ...(type ? { type: type as TransactionType } : {}) },
      include: { member: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeRule(userId: string, id: string) {
    const rule = await this.prisma.transactionRule.findFirst({ where: { id, userId } });
    if (!rule) throw new NotFoundException();
    await this.prisma.transaction.deleteMany({ where: { ruleId: id } });
    return this.prisma.transactionRule.delete({ where: { id } });
  }

  private async generateTransactions(rule: TransactionRule): Promise<void> {
    const transactions: Prisma.TransactionCreateManyInput[] = [];
    const start = new Date(rule.startDate);

    if (rule.ruleType === 'INSTALLMENT') {
      for (let i = 0; i < (rule.totalInstallments ?? 0); i++) {
        const date = this.addMonths(start, i);
        transactions.push({
          amount: rule.amount,
          description: `${rule.description} (${i + 1}/${rule.totalInstallments})`,
          date,
          type: rule.type,
          memberId: rule.memberId,
          categoryId: rule.categoryId,
          ruleId: rule.id,
          installmentNumber: i + 1,
        });
      }
    } else {
      const end = rule.endDate ? new Date(rule.endDate) : this.addMonths(start, 18);
      let current = new Date(start);
      while (current <= end) {
        transactions.push({
          amount: rule.amount,
          description: rule.description,
          date: new Date(current),
          type: rule.type,
          memberId: rule.memberId,
          categoryId: rule.categoryId,
          ruleId: rule.id,
        });
        current = this.addByRecurrence(current, rule.recurrence);
      }
    }

    await this.prisma.transaction.createMany({ data: transactions });
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private addByRecurrence(date: Date, recurrence: string | null): Date {
    const d = new Date(date);
    if (recurrence === 'MONTHLY') d.setMonth(d.getMonth() + 1);
    else if (recurrence === 'WEEKLY') d.setDate(d.getDate() + 7);
    else if (recurrence === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  private async validateOwnership(userId: string, memberId: string, categoryId: string): Promise<void> {
    const [member, category] = await Promise.all([
      this.prisma.member.findFirst({ where: { id: memberId, userId } }),
      this.prisma.category.findFirst({ where: { id: categoryId, userId } }),
    ]);
    if (!member || !category) throw new NotFoundException('Membro ou categoria não encontrado');
  }
}
