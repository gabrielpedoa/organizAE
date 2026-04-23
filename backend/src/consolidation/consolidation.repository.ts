import { Injectable } from "@nestjs/common";
import {
  BudgetItem,
  BudgetItemStatus,
  Category,
  Member,
  MonthlyConsolidation,
  Prisma,
  TransactionRule,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConsolidationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertConsolidation(
    userId: string,
    month: number,
    year: number,
  ): Promise<MonthlyConsolidation> {
    return this.prisma.monthlyConsolidation.upsert({
      where: { userId_month_year: { userId, month, year } },
      create: { userId, month, year },
      update: {},
    });
  }

  async findConsolidationById(id: string): Promise<MonthlyConsolidation | null> {
    return this.prisma.monthlyConsolidation.findUnique({ where: { id } });
  }

  async findConsolidationWithItems(
    id: string,
  ): Promise<
    Prisma.MonthlyConsolidationGetPayload<{
      include: {
        items: {
          include: { member: true; category: true; transaction: true };
          orderBy: { dueDate: "asc" };
        };
      };
    }> | null
  > {
    return this.prisma.monthlyConsolidation.findUnique({
      where: { id },
      include: {
        items: {
          include: { member: true, category: true, transaction: true },
          orderBy: { dueDate: "asc" },
        },
      },
    });
  }

  async findConsolidationByMonthYear(
    userId: string,
    month: number,
    year: number,
  ): Promise<
    Prisma.MonthlyConsolidationGetPayload<{
      include: {
        items: {
          include: { member: true; category: true; transaction: true };
          orderBy: { dueDate: "asc" };
        };
      };
    }> | null
  > {
    return this.prisma.monthlyConsolidation.findUnique({
      where: { userId_month_year: { userId, month, year } },
      include: {
        items: {
          include: { member: true, category: true, transaction: true },
          orderBy: { dueDate: "asc" },
        },
      },
    });
  }

  async findConsolidationForUser(
    id: string,
    userId: string,
  ): Promise<MonthlyConsolidation | null> {
    return this.prisma.monthlyConsolidation.findFirst({ where: { id, userId } });
  }

  async findConsolidationForUserWithPendingItems(
    id: string,
    userId: string,
  ): Promise<
    Prisma.MonthlyConsolidationGetPayload<{
      include: { items: { where: { status: "PENDING" }; select: { id: true } } };
    }> | null
  > {
    return this.prisma.monthlyConsolidation.findFirst({
      where: { id, userId },
      include: {
        items: {
          where: { status: BudgetItemStatus.PENDING },
          select: { id: true },
        },
      },
    });
  }

  async findConsolidationForUserWithItems(
    id: string,
    userId: string,
  ): Promise<
    Prisma.MonthlyConsolidationGetPayload<{
      include: {
        items: {
          include: { member: true; category: true; transaction: true };
          orderBy: { dueDate: "asc" };
        };
      };
    }> | null
  > {
    return this.prisma.monthlyConsolidation.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: { member: true, category: true, transaction: true },
          orderBy: { dueDate: "asc" },
        },
      },
    });
  }

  async updateConsolidation(
    id: string,
    data: Prisma.MonthlyConsolidationUpdateInput,
  ): Promise<MonthlyConsolidation> {
    return this.prisma.monthlyConsolidation.update({ where: { id }, data });
  }

  async findActiveRules(userId: string): Promise<TransactionRule[]> {
    return this.prisma.transactionRule.findMany({ where: { userId } });
  }

  async findExistingBudgetItemRuleIds(consolidationId: string): Promise<Set<string>> {
    const results = await this.prisma.budgetItem.findMany({
      where: { consolidationId, ruleId: { not: null } },
      select: { ruleId: true },
    });
    return new Set(results.map((item) => item.ruleId as string));
  }

  async createManyBudgetItems(data: Prisma.BudgetItemCreateManyInput[]): Promise<void> {
    await this.prisma.budgetItem.createMany({ data, skipDuplicates: true });
  }

  async findBudgetItemForUser(
    budgetItemId: string,
    userId: string,
  ): Promise<BudgetItem | null> {
    return this.prisma.budgetItem.findFirst({
      where: { id: budgetItemId, consolidation: { userId } },
    });
  }

  async updateBudgetItem(
    id: string,
    data: Prisma.BudgetItemUpdateInput,
  ): Promise<
    Prisma.BudgetItemGetPayload<{
      include: { member: true; category: true; transaction: true };
    }>
  > {
    return this.prisma.budgetItem.update({
      where: { id },
      data,
      include: { member: true, category: true, transaction: true },
    });
  }

  async createBudgetItem(data: Prisma.BudgetItemCreateInput): Promise<
    Prisma.BudgetItemGetPayload<{
      include: { member: true; category: true };
    }>
  > {
    return this.prisma.budgetItem.create({
      data,
      include: { member: true, category: true },
    });
  }

  async findMemberForUser(memberId: string, userId: string): Promise<Member | null> {
    return this.prisma.member.findFirst({ where: { id: memberId, userId } });
  }

  async findCategoryForUser(
    categoryId: string,
    userId: string,
  ): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id: categoryId, userId } });
  }

  async confirmPayment(
    budgetItemId: string,
    transactionData: Prisma.TransactionCreateInput,
  ): Promise<
    Prisma.BudgetItemGetPayload<{
      include: { member: true; category: true; transaction: true };
    }>
  > {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data: transactionData });
      return tx.budgetItem.update({
        where: { id: budgetItemId },
        data: {
          status: BudgetItemStatus.PAID,
          transactionId: transaction.id,
          note: transactionData.note,
        },
        include: { member: true, category: true, transaction: true },
      });
    });
  }

  async confirmReceipt(
    budgetItemId: string,
    transactionData: Prisma.TransactionCreateInput,
  ): Promise<
    Prisma.BudgetItemGetPayload<{
      include: { member: true; category: true; transaction: true };
    }>
  > {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data: transactionData });
      return tx.budgetItem.update({
        where: { id: budgetItemId },
        data: {
          status: BudgetItemStatus.RECEIVED,
          transactionId: transaction.id,
          note: transactionData.note,
        },
        include: { member: true, category: true, transaction: true },
      });
    });
  }

  async cancelBudgetItem(
    budgetItemId: string,
    reason: string | undefined,
    existingTransactionId: string | null,
  ): Promise<
    Prisma.BudgetItemGetPayload<{
      include: { member: true; category: true };
    }>
  > {
    return this.prisma.$transaction(async (tx) => {
      if (existingTransactionId) {
        await tx.transaction.delete({ where: { id: existingTransactionId } });
      }
      return tx.budgetItem.update({
        where: { id: budgetItemId },
        data: { status: BudgetItemStatus.CANCELLED, note: reason },
        include: { member: true, category: true },
      });
    });
  }

  async resetConsolidation(
    consolidationId: string,
  ): Promise<
    Prisma.MonthlyConsolidationGetPayload<{
      include: {
        items: {
          include: { member: true; category: true; transaction: true };
          orderBy: { dueDate: "asc" };
        };
      };
    }>
  > {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.budgetItem.findMany({ where: { consolidationId } });
      const transactionIds = items
        .map((item) => item.transactionId)
        .filter((id): id is string => id !== null);

      if (transactionIds.length > 0) {
        await tx.transaction.deleteMany({ where: { id: { in: transactionIds } } });
      }

      await tx.budgetItem.deleteMany({ where: { consolidationId, ruleId: null } });
      await tx.budgetItem.updateMany({
        where: { consolidationId },
        data: { status: "PENDING", transactionId: null },
      });

      return tx.monthlyConsolidation.update({
        where: { id: consolidationId },
        data: { status: "OPEN", closedAt: null },
        include: {
          items: {
            include: { member: true, category: true, transaction: true },
            orderBy: { dueDate: "asc" },
          },
        },
      });
    });
  }

  async findConsolidationItemsWithTransactions(
    consolidationId: string,
    userId: string,
  ): Promise<
    Prisma.MonthlyConsolidationGetPayload<{
      include: {
        items: {
          where: { status: { in: ["PAID", "RECEIVED"] } };
          include: { transaction: true };
        };
      };
    }> | null
  > {
    return this.prisma.monthlyConsolidation.findFirst({
      where: { id: consolidationId, userId },
      include: {
        items: {
          where: { status: { in: [BudgetItemStatus.PAID, BudgetItemStatus.RECEIVED] } },
          include: { transaction: true },
        },
      },
    });
  }
}
