import { Injectable } from "@nestjs/common";
import {
  Account,
  AccountEntry,
  InvestmentPosition,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
      include: { members: { include: { member: true } }, investments: true },
      orderBy: { createdAt: "asc" },
    });
  }

  findByIdAndUser(id: string, userId: string): Promise<Account | null> {
    return this.prisma.account.findFirst({
      where: { id, userId },
      include: { members: { include: { member: true } }, investments: true },
    });
  }

  findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({ where: { id } });
  }

  create(data: Prisma.AccountCreateInput): Promise<Account> {
    return this.prisma.account.create({
      data,
      include: { members: { include: { member: true } }, investments: true },
    });
  }

  update(id: string, data: Prisma.AccountUpdateInput): Promise<Account> {
    return this.prisma.account.update({
      where: { id },
      data,
      include: { members: { include: { member: true } }, investments: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.account.delete({ where: { id } });
  }

  createInvestment(
    data: Prisma.InvestmentPositionCreateInput,
  ): Promise<InvestmentPosition> {
    return this.prisma.investmentPosition.create({ data });
  }

  updateInvestment(
    id: string,
    data: Prisma.InvestmentPositionUpdateInput,
  ): Promise<InvestmentPosition> {
    return this.prisma.investmentPosition.update({ where: { id }, data });
  }

  findInvestmentById(id: string): Promise<InvestmentPosition | null> {
    return this.prisma.investmentPosition.findUnique({ where: { id } });
  }

  async deleteInvestment(id: string): Promise<void> {
    await this.prisma.investmentPosition.delete({ where: { id } });
  }

  findEntriesByAccount(accountId: string): Promise<AccountEntry[]> {
    return this.prisma.accountEntry.findMany({
      where: { accountId },
      orderBy: { date: "desc" },
      take: 50,
    });
  }

  async createEntryAndUpdateBalance(
    accountId: string,
    entryData: Prisma.AccountEntryCreateInput,
    balanceDelta: Prisma.Decimal,
  ): Promise<AccountEntry> {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.accountEntry.create({ data: entryData });
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: balanceDelta } },
      });
      return entry;
    });
  }

  async createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amount: Prisma.Decimal,
    description: string,
    date: Date,
    note?: string,
  ): Promise<{ fromEntry: AccountEntry; toEntry: AccountEntry }> {
    return this.prisma.$transaction(async (tx) => {
      const transferPairId = crypto.randomUUID();
      const fromEntry = await tx.accountEntry.create({
        data: {
          account: { connect: { id: fromAccountId } },
          type: "TRANSFER_OUT",
          amount,
          description,
          date,
          note,
          transferPairId,
        },
      });
      const toEntry = await tx.accountEntry.create({
        data: {
          account: { connect: { id: toAccountId } },
          type: "TRANSFER_IN",
          amount,
          description,
          date,
          note,
          transferPairId,
        },
      });
      await tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });
      await tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });
      return { fromEntry, toEntry };
    });
  }

  async reverseEntry(entryId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const entry = await tx.accountEntry.findUnique({
        where: { id: entryId },
      });
      if (!entry) return;
      const isDebit = entry.type === "EXPENSE" || entry.type === "TRANSFER_OUT";
      await tx.account.update({
        where: { id: entry.accountId },
        data: {
          balance: isDebit
            ? { increment: entry.amount }
            : { decrement: entry.amount },
        },
      });
      await tx.accountEntry.delete({ where: { id: entryId } });
    });
  }

  findEntryByBudgetItem(budgetItemId: string): Promise<AccountEntry | null> {
    return this.prisma.accountEntry.findUnique({ where: { budgetItemId } });
  }
}
