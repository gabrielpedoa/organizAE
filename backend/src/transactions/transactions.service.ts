import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionRule, TransactionType } from '@prisma/client';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { toMidnightUTC } from '../common/utils/date.utils';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly transactionsRepository: TransactionsRepository) {}

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
    return this.transactionsRepository.findMany(where);
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.validateOwnership(userId, dto.memberId, dto.categoryId);
    return this.transactionsRepository.create({
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      date: new Date(dto.date),
      member: { connect: { id: dto.memberId } },
      category: { connect: { id: dto.categoryId } },
    });
  }

  async createBulk(userId: string, dtos: CreateTransactionDto[]) {
    await Promise.all(dtos.map((dto) => this.validateOwnership(userId, dto.memberId, dto.categoryId)));
    return this.transactionsRepository.createMany(
      dtos.map((dto) => ({
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        date: new Date(dto.date),
        memberId: dto.memberId,
        categoryId: dto.categoryId,
      })),
    );
  }

  async update(userId: string, id: string, dto: Partial<CreateTransactionDto>) {
    const tx = await this.transactionsRepository.findByIdAndUser(id, userId);
    if (!tx) throw new NotFoundException();
    const { date, ...rest } = dto;
    const updateData: Prisma.TransactionUpdateInput = {
      ...rest,
      ...(date ? { date: new Date(date) } : {}),
    };
    return this.transactionsRepository.update(id, updateData);
  }

  async remove(userId: string, id: string) {
    const tx = await this.transactionsRepository.findByIdAndUser(id, userId);
    if (!tx) throw new NotFoundException();
    return this.transactionsRepository.delete(id);
  }

  async updateRule(userId: string, id: string, dto: UpdateRuleDto) {
    const rule = await this.transactionsRepository.findRuleByIdAndUser(id, userId);
    if (!rule) throw new NotFoundException('Regra não encontrada');

    if (
      rule.ruleType === 'INSTALLMENT' &&
      dto.totalInstallments !== undefined &&
      dto.totalInstallments < (rule.totalInstallments ?? 0)
    ) {
      const blocked = await this.transactionsRepository.countPaidBudgetItemsBeyondInstallment(id, dto.totalInstallments);
      if (blocked > 0) {
        throw new BadRequestException(
          `Não é possível reduzir o número de parcelas: ${blocked} parcela(s) já confirmada(s) ficariam fora do novo total.`,
        );
      }
    }

    if (dto.memberId || dto.categoryId) {
      await this.validateOwnership(
        userId,
        dto.memberId ?? rule.memberId,
        dto.categoryId ?? rule.categoryId,
      );
    }

    return this.transactionsRepository.updateRule(id, {
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.memberId !== undefined ? { member: { connect: { id: dto.memberId } } } : {}),
      ...(dto.categoryId !== undefined ? { category: { connect: { id: dto.categoryId } } } : {}),
      ...(dto.expenseType !== undefined ? { expenseType: dto.expenseType } : {}),
      ...(dto.recurrence !== undefined ? { recurrence: dto.recurrence } : {}),
      ...(dto.startDate !== undefined ? { startDate: toMidnightUTC(dto.startDate) } : {}),
      ...(dto.endDate !== undefined ? { endDate: dto.endDate ? toMidnightUTC(dto.endDate) : null } : {}),
      ...(dto.totalInstallments !== undefined ? { totalInstallments: dto.totalInstallments } : {}),
      ...(dto.isVariable !== undefined ? { isVariable: dto.isVariable } : {}),
    });
  }

  async createRule(userId: string, dto: CreateRuleDto) {
    await this.validateOwnership(userId, dto.memberId, dto.categoryId);
    const rule = await this.transactionsRepository.createRule({
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      member: { connect: { id: dto.memberId } },
      category: { connect: { id: dto.categoryId } },
      user: { connect: { id: userId } },
      ruleType: dto.ruleType,
      recurrence: dto.recurrence,
      startDate: toMidnightUTC(dto.startDate),
      endDate: dto.endDate ? toMidnightUTC(dto.endDate) : null,
      totalInstallments: dto.totalInstallments,
      isVariable: dto.isVariable ?? false,
      expenseType: dto.expenseType ?? null,
    });
    await this.generateTransactions(rule);
    return rule;
  }

  listRules(userId: string, type?: string) {
    return this.transactionsRepository.findRules(userId, type as TransactionType);
  }

  async removeRule(userId: string, id: string) {
    const rule = await this.transactionsRepository.findRuleByIdAndUser(id, userId);
    if (!rule) throw new NotFoundException();
    await this.transactionsRepository.deleteMany({ ruleId: id });
    return this.transactionsRepository.deleteRule(id);
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

    await this.transactionsRepository.createMany(transactions);
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
  }

  private addByRecurrence(date: Date, recurrence: string | null): Date {
    const d = new Date(date);
    if (recurrence === 'MONTHLY') d.setUTCMonth(d.getUTCMonth() + 1);
    else if (recurrence === 'WEEKLY') d.setUTCDate(d.getUTCDate() + 7);
    else if (recurrence === 'YEARLY') d.setUTCFullYear(d.getUTCFullYear() + 1);
    return d;
  }

  private async validateOwnership(userId: string, memberId: string, categoryId: string): Promise<void> {
    const [member, category] = await Promise.all([
      this.transactionsRepository.findMemberForUser(memberId, userId),
      this.transactionsRepository.findCategoryForUser(categoryId, userId),
    ]);
    if (!member || !category) throw new NotFoundException('Membro ou categoria não encontrado');
  }
}
