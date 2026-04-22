import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BudgetItemStatus,
  Prisma,
  TransactionRule,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// ─── DTOs (inline, mirrored in dto/ files for the controller) ─────────────────

export interface ConfirmPaymentData {
  paidAt: Date;
  amount: number;
  note?: string;
}

export interface ConfirmReceiptData {
  receivedAt: Date;
  amount: number;
  note?: string;
}

export interface AddBudgetItemData {
  memberId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  dueDate: Date;
  installmentNumber?: number;
  expenseType?: 'FIXED' | 'VARIABLE' | 'INVESTMENT' | 'TRANSFER';
  note?: string;
}

export interface UpdateBudgetItemData {
  amount?: number;
  description?: string;
  dueDate?: Date;
  note?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ConsolidationService {
  constructor(private prisma: PrismaService) {}

  // ── 1. Generate ────────────────────────────────────────────────────────────

  /**
   * Idempotent: creates the MonthlyConsolidation if it doesn't exist, then
   * generates PENDING BudgetItems for every TransactionRule active in that period.
   * Rules that already have a BudgetItem in this consolidation are skipped.
   */
  async generateMonthlyConsolidation(userId: string, month: number, year: number) {
    const consolidation = await this.prisma.monthlyConsolidation.upsert({
      where: { userId_month_year: { userId, month, year } },
      create: { userId, month, year },
      update: {},
    });

    if (consolidation.status === 'CLOSED') {
      throw new BadRequestException('Consolidação já está fechada');
    }

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0); // last day of month

    const rules = await this.prisma.transactionRule.findMany({ where: { userId } });

    // Rules that already have a BudgetItem in this period — skip them
    const existing = await this.prisma.budgetItem.findMany({
      where: { consolidationId: consolidation.id, ruleId: { not: null } },
      select: { ruleId: true },
    });
    const existingRuleIds = new Set(existing.map((i) => i.ruleId));

    const toCreate: Prisma.BudgetItemCreateManyInput[] = [];

    for (const rule of rules) {
      if (existingRuleIds.has(rule.id)) continue;

      const occurrences = this.occurrencesInMonth(rule, month, year, periodStart, periodEnd);
      for (const occ of occurrences) {
        toCreate.push({
          consolidationId: consolidation.id,
          ruleId: rule.id,
          memberId: rule.memberId,
          categoryId: rule.categoryId,
          type: rule.type,
          expenseType: rule.expenseType ?? null,
          amount: rule.amount,
          description: occ.description,
          dueDate: occ.date,
          installmentNumber: occ.installmentNumber ?? null,
          status: 'PENDING',
        });
      }
    }

    if (toCreate.length > 0) {
      // skipDuplicates handles race conditions and the WEEKLY multi-occurrence edge case
      await this.prisma.budgetItem.createMany({ data: toCreate, skipDuplicates: true });
    }

    return this.prisma.monthlyConsolidation.findUnique({
      where: { id: consolidation.id },
      include: {
        items: {
          include: { member: true, category: true, transaction: true },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  }

  // ── 2. Confirm payment (EXPENSE → PAID) ───────────────────────────────────

  async confirmPayment(userId: string, budgetItemId: string, data: ConfirmPaymentData) {
    const item = await this.findItemForUser(userId, budgetItemId);

    if (item.status !== 'PENDING') {
      throw new BadRequestException('Item não está pendente');
    }
    if (item.type !== TransactionType.EXPENSE) {
      throw new BadRequestException('Use confirmReceipt para receitas');
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          description: item.description,
          date: data.paidAt,
          type: TransactionType.EXPENSE,
          memberId: item.memberId,
          categoryId: item.categoryId,
          ruleId: item.ruleId,
          installmentNumber: item.installmentNumber,
          consolidationId: item.consolidationId,
          expenseType: item.expenseType ?? null,
          note: data.note,
        },
      });

      return tx.budgetItem.update({
        where: { id: budgetItemId },
        data: {
          status: BudgetItemStatus.PAID,
          transactionId: transaction.id,
          note: data.note ?? item.note,
        },
        include: { member: true, category: true, transaction: true },
      });
    });
  }

  // ── 3. Confirm receipt (INCOME → RECEIVED) ────────────────────────────────

  async confirmReceipt(userId: string, budgetItemId: string, data: ConfirmReceiptData) {
    const item = await this.findItemForUser(userId, budgetItemId);

    if (item.status !== 'PENDING') {
      throw new BadRequestException('Item não está pendente');
    }
    if (item.type !== TransactionType.INCOME) {
      throw new BadRequestException('Use confirmPayment para despesas');
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          description: item.description,
          date: data.receivedAt,
          type: TransactionType.INCOME,
          memberId: item.memberId,
          categoryId: item.categoryId,
          ruleId: item.ruleId,
          installmentNumber: item.installmentNumber,
          consolidationId: item.consolidationId,
          note: data.note,
        },
      });

      return tx.budgetItem.update({
        where: { id: budgetItemId },
        data: {
          status: BudgetItemStatus.RECEIVED,
          transactionId: transaction.id,
          note: data.note ?? item.note,
        },
        include: { member: true, category: true, transaction: true },
      });
    });
  }

  // ── 4. Cancel ─────────────────────────────────────────────────────────────

  /**
   * Marks the item as CANCELLED.
   * If the item was already confirmed (PAID/RECEIVED), the linked Transaction
   * is deleted (hard reversal). The FK cascade sets transactionId → null.
   */
  async cancelBudgetItem(userId: string, budgetItemId: string, reason?: string) {
    const item = await this.findItemForUser(userId, budgetItemId);

    if (item.status === BudgetItemStatus.CANCELLED) {
      throw new BadRequestException('Item já está cancelado');
    }

    return this.prisma.$transaction(async (tx) => {
      if (item.transactionId) {
        // Deleting the Transaction triggers ON DELETE SET NULL on BudgetItem.transactionId
        await tx.transaction.delete({ where: { id: item.transactionId } });
      }

      return tx.budgetItem.update({
        where: { id: budgetItemId },
        data: {
          status: BudgetItemStatus.CANCELLED,
          note: reason ?? item.note,
        },
        include: { member: true, category: true },
      });
    });
  }

  // ── 5. Update (PENDING only) ───────────────────────────────────────────────

  /**
   * Edits a PENDING BudgetItem. Never touches the originating TransactionRule.
   */
  async updateBudgetItem(userId: string, budgetItemId: string, data: UpdateBudgetItemData) {
    const item = await this.findItemForUser(userId, budgetItemId);

    if (item.status !== BudgetItemStatus.PENDING) {
      throw new BadRequestException('Apenas itens PENDENTES podem ser editados');
    }

    return this.prisma.budgetItem.update({
      where: { id: budgetItemId },
      data: {
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
      },
      include: { member: true, category: true, transaction: true },
    });
  }

  // ── 6. Add avulso item ────────────────────────────────────────────────────

  /** Adds a manually-created BudgetItem (no originating TransactionRule). */
  async addBudgetItem(userId: string, consolidationId: string, data: AddBudgetItemData) {
    const consolidation = await this.prisma.monthlyConsolidation.findFirst({
      where: { id: consolidationId, userId },
    });
    if (!consolidation) throw new NotFoundException('Consolidação não encontrada');
    if (consolidation.status === 'CLOSED') {
      throw new BadRequestException('Não é possível adicionar itens a uma consolidação fechada');
    }

    const [member, category] = await Promise.all([
      this.prisma.member.findFirst({ where: { id: data.memberId, userId } }),
      this.prisma.category.findFirst({ where: { id: data.categoryId, userId } }),
    ]);
    if (!member || !category) throw new NotFoundException('Membro ou categoria não encontrado');

    return this.prisma.budgetItem.create({
      data: {
        consolidationId,
        memberId: data.memberId,
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        dueDate: new Date(data.dueDate),
        installmentNumber: data.installmentNumber,
        expenseType: data.expenseType ?? null,
        note: data.note,
        // ruleId intentionally omitted — this is an avulso item
      },
      include: { member: true, category: true },
    });
  }

  // ── 7. Summary ────────────────────────────────────────────────────────────

  /**
   * Returns planned vs realised totals for the period, broken down by
   * income/expense, category, and member.
   */
  async getConsolidationSummary(userId: string, consolidationId: string) {
    const consolidation = await this.prisma.monthlyConsolidation.findFirst({
      where: { id: consolidationId, userId },
      include: {
        items: {
          include: { member: true, category: true, transaction: true },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
    if (!consolidation) throw new NotFoundException('Consolidação não encontrada');

    type Item = (typeof consolidation.items)[number];
    const active = consolidation.items.filter((i) => i.status !== BudgetItemStatus.CANCELLED);

    const incomeItems = active.filter((i) => i.type === TransactionType.INCOME);
    const expenseItems = active.filter((i) => i.type === TransactionType.EXPENSE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sum = (items: Item[], getValue: (i: Item) => any): number =>
      items.reduce((s, i) => s + Number(getValue(i) ?? 0), 0);

    const incomePlanned = sum(incomeItems, (i) => i.amount);
    const incomeRealized = sum(
      incomeItems.filter((i) => i.transaction),
      (i) => i.transaction!.amount,
    );
    const incomePending = sum(
      incomeItems.filter((i) => i.status === BudgetItemStatus.PENDING),
      (i) => i.amount,
    );

    const expensePlanned = sum(expenseItems, (i) => i.amount);
    const expenseRealized = sum(
      expenseItems.filter((i) => i.transaction),
      (i) => i.transaction!.amount,
    );
    const expensePending = sum(
      expenseItems.filter((i) => i.status === BudgetItemStatus.PENDING),
      (i) => i.amount,
    );

    // ─ By category ─
    const categoryMap = new Map<
      string,
      { category: Item['category']; planned: number; realized: number; items: Item[] }
    >();
    for (const item of active) {
      if (!categoryMap.has(item.categoryId)) {
        categoryMap.set(item.categoryId, { category: item.category, planned: 0, realized: 0, items: [] });
      }
      const entry = categoryMap.get(item.categoryId)!;
      entry.planned += Number(item.amount);
      if (item.transaction) entry.realized += Number(item.transaction.amount);
      entry.items.push(item);
    }

    // ─ By member ─
    const memberMap = new Map<
      string,
      { member: Item['member']; planned: number; realized: number; items: Item[] }
    >();
    for (const item of active.filter((i) => i.type === TransactionType.EXPENSE)) {
      if (!memberMap.has(item.memberId)) {
        memberMap.set(item.memberId, { member: item.member, planned: 0, realized: 0, items: [] });
      }
      const entry = memberMap.get(item.memberId)!;
      entry.planned += Number(item.amount);
      if (item.transaction) entry.realized += Number(item.transaction.amount);
      entry.items.push(item);
    }

    return {
      period: { month: consolidation.month, year: consolidation.year },
      status: consolidation.status,
      closedAt: consolidation.closedAt ?? null,
      income: { planned: incomePlanned, realized: incomeRealized, pending: incomePending },
      expense: { planned: expensePlanned, realized: expenseRealized, pending: expensePending },
      balance: {
        planned: incomePlanned - expensePlanned,
        realized: incomeRealized - expenseRealized,
      },
      byCategory: Array.from(categoryMap.values()),
      byMember: Array.from(memberMap.values()),
      items: {
        pending: consolidation.items.filter((i) => i.status === BudgetItemStatus.PENDING),
        paid: consolidation.items.filter(
          (i) => i.status === BudgetItemStatus.PAID || i.status === BudgetItemStatus.RECEIVED,
        ),
        cancelled: consolidation.items.filter((i) => i.status === BudgetItemStatus.CANCELLED),
      },
    };
  }

  // ── 8. Find by month/year (returns null if not found) ────────────────────

  async findByMonthYear(userId: string, month: number, year: number) {
    return this.prisma.monthlyConsolidation.findUnique({
      where: { userId_month_year: { userId, month, year } },
      include: {
        items: {
          include: { member: true, category: true, transaction: true },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  }

  // ── 9. Close ──────────────────────────────────────────────────────────────

  /**
   * Closes the period. By default, refuses if there are PENDING items.
   * Pass force=true to close anyway (open items are left in place for historical reference).
   */
  async closeConsolidation(userId: string, consolidationId: string, force = false) {
    const consolidation = await this.prisma.monthlyConsolidation.findFirst({
      where: { id: consolidationId, userId },
      include: {
        items: { where: { status: BudgetItemStatus.PENDING }, select: { id: true } },
      },
    });
    if (!consolidation) throw new NotFoundException('Consolidação não encontrada');
    if (consolidation.status === 'CLOSED') {
      throw new BadRequestException('Consolidação já está fechada');
    }

    if (consolidation.items.length > 0 && !force) {
      throw new BadRequestException(
        `Existem ${consolidation.items.length} item(ns) pendente(s). Passe force=true para fechar mesmo assim.`,
      );
    }

    return this.prisma.monthlyConsolidation.update({
      where: { id: consolidationId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  // ── 10. Reset ─────────────────────────────────────────────────────────────

  async resetConsolidation(userId: string, consolidationId: string) {
    const consolidation = await this.prisma.monthlyConsolidation.findUnique({
      where: { id: consolidationId },
    });
    if (!consolidation) throw new NotFoundException('Consolidação não encontrada');
    if (consolidation.userId !== userId) throw new ForbiddenException();

    return this.prisma.$transaction(async (tx) => {
      const items = await tx.budgetItem.findMany({ where: { consolidationId } });

      const transactionIds = items
        .map((i) => i.transactionId)
        .filter((id): id is string => id !== null);

      if (transactionIds.length > 0) {
        await tx.transaction.deleteMany({ where: { id: { in: transactionIds } } });
      }

      await tx.budgetItem.deleteMany({ where: { consolidationId, ruleId: null } });

      await tx.budgetItem.updateMany({
        where: { consolidationId },
        data: { status: 'PENDING', transactionId: null },
      });

      return tx.monthlyConsolidation.update({
        where: { id: consolidationId },
        data: { status: 'OPEN', closedAt: null },
        include: {
          items: {
            include: { member: true, category: true, transaction: true },
            orderBy: { dueDate: 'asc' },
          },
        },
      });
    });
  }

  // ── New methods for dashboard ─────────────────────────────────────────────

  async getDailyFlow(userId: string, consolidationId: string) {
    const consolidation = await this.prisma.monthlyConsolidation.findFirst({
      where: { id: consolidationId, userId },
      include: {
        items: {
          where: { status: { in: [BudgetItemStatus.PAID, BudgetItemStatus.RECEIVED] } },
          include: { transaction: true },
        },
      },
    });
    if (!consolidation) throw new NotFoundException('Consolidação não encontrada');

    const year = consolidation.year;
    const month = consolidation.month;
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyMap = new Map<number, { income: number; expense: number }>();
    for (let day = 1; day <= daysInMonth; day++) {
      dailyMap.set(day, { income: 0, expense: 0 });
    }

    for (const item of consolidation.items) {
      if (!item.transaction) continue;
      const day = item.transaction.date.getUTCDate();
      const amount = Number(item.transaction.amount);
      if (item.type === TransactionType.INCOME) {
        dailyMap.get(day)!.income += amount;
      } else {
        dailyMap.get(day)!.expense += amount;
      }
    }

    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const { income, expense } = dailyMap.get(day)!;
      result.push({
        day,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        income,
        expense,
        balance: income - expense,
      });
    }
    return result;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async findItemForUser(userId: string, budgetItemId: string) {
    const item = await this.prisma.budgetItem.findFirst({
      where: { id: budgetItemId, consolidation: { userId } },
    });
    if (!item) throw new NotFoundException('Item não encontrado');
    return item;
  }

  /**
   * Returns every occurrence of a TransactionRule that falls within the given
   * calendar month.
   *
   * INSTALLMENT: O(1) — directly calculates which installment index maps to
   *   the target month (no iteration needed).
   *
   * RECURRING MONTHLY / YEARLY: at most one occurrence per calendar month.
   *
   * RECURRING WEEKLY: may yield up to 5 occurrences per month. Note that the
   *   DB unique constraint @@unique([consolidationId, ruleId]) means only the
   *   first weekly occurrence survives via skipDuplicates in createMany.
   *   This is an accepted limitation for this budgeting model.
   */
  private occurrencesInMonth(
    rule: TransactionRule,
    month: number,
    year: number,
    periodStart: Date,
    periodEnd: Date,
  ): Array<{ date: Date; description: string; installmentNumber?: number }> {
    const results: Array<{ date: Date; description: string; installmentNumber?: number }> = [];

    if (rule.ruleType === 'INSTALLMENT') {
      const startMonthAbs = rule.startDate.getUTCFullYear() * 12 + rule.startDate.getUTCMonth();
      const targetMonthAbs = year * 12 + (month - 1);
      const idx = targetMonthAbs - startMonthAbs;

      if (idx >= 0 && idx < (rule.totalInstallments ?? 0)) {
        results.push({
          date: this.addMonths(rule.startDate, idx),
          description: `${rule.description} (${idx + 1}/${rule.totalInstallments})`,
          installmentNumber: idx + 1,
        });
      }
      return results;
    }

    // RECURRING
    const ruleStart = new Date(rule.startDate);
    if (ruleStart > periodEnd) return results; // rule hasn't started yet

    const ruleEnd = rule.endDate ? new Date(rule.endDate) : this.addMonths(ruleStart, 18);
    if (ruleEnd < periodStart) return results; // rule has already ended

    // Fast-forward to first occurrence on or after periodStart
    let current = new Date(ruleStart);
    while (current < periodStart) {
      current = this.advance(current, rule.recurrence);
    }

    // Collect occurrences within the period
    while (current <= periodEnd) {
      if (current >= ruleStart && (!rule.endDate || current <= ruleEnd)) {
        results.push({ date: new Date(current), description: rule.description });
      }
      // MONTHLY and YEARLY produce at most one occurrence per calendar month
      if (rule.recurrence !== 'WEEKLY') break;
      current = this.advance(current, rule.recurrence);
    }

    return results;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
  }

  private advance(date: Date, recurrence: string | null): Date {
    const d = new Date(date);
    if (recurrence === 'MONTHLY') d.setMonth(d.getMonth() + 1);
    else if (recurrence === 'WEEKLY') d.setDate(d.getDate() + 7);
    else if (recurrence === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
    return d;
  }
}

