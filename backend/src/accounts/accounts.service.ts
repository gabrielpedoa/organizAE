import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { AccountEntryType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { AccountsRepository } from "./accounts.repository";
import { CreateAccountDto } from "./dto/create-account.dto";
import { CreateInvestmentDto } from "./dto/create-investment.dto";
import { TransferDto } from "./dto/transfer.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { UpdateInvestmentDto } from "./dto/update-investment.dto";

function toMidnightUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(private readonly accountsRepository: AccountsRepository) {}

  findAll(userId: string) {
    return this.accountsRepository.findAllByUser(userId);
  }

  async findOne(id: string, userId: string) {
    const account = await this.accountsRepository.findByIdAndUser(id, userId);
    if (!account) {
      throw new NotFoundException("Conta não encontrada");
    }
    return account;
  }

  async create(userId: string, dto: CreateAccountDto) {
    const data: Record<string, unknown> = {
      name: dto.name,
      type: dto.type,
      institution: dto.institution,
      balance: dto.initialBalance
        ? new Decimal(dto.initialBalance)
        : new Decimal(0),
      user: { connect: { id: userId } },
    };

    if (dto.memberIds && dto.memberIds.length > 0) {
      data.members = {
        create: dto.memberIds.map((memberId) => ({
          member: { connect: { id: memberId } },
        })),
      };
    }

    return this.accountsRepository.create(data as never);
  }

  async update(id: string, userId: string, dto: UpdateAccountDto) {
    const existing = await this.accountsRepository.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundException("Conta não encontrada");
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.institution !== undefined) data.institution = dto.institution;
    if (dto.type !== undefined) data.type = dto.type;

    return this.accountsRepository.update(id, data as never);
  }

  async remove(id: string, userId: string) {
    const existing = await this.accountsRepository.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundException("Conta não encontrada");
    }
    return this.accountsRepository.delete(id);
  }

  async createInvestment(
    accountId: string,
    userId: string,
    dto: CreateInvestmentDto,
  ) {
    const account = await this.accountsRepository.findByIdAndUser(
      accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException("Conta não encontrada");
    }

    return this.accountsRepository.createInvestment({
      name: dto.name,
      productType: dto.productType,
      amount: new Decimal(dto.amount),
      note: dto.note,
      account: { connect: { id: accountId } },
    });
  }

  async updateInvestment(
    investmentId: string,
    userId: string,
    dto: UpdateInvestmentDto,
  ) {
    const investment =
      await this.accountsRepository.findInvestmentById(investmentId);
    if (!investment) {
      throw new NotFoundException("Investimento não encontrado");
    }

    const account = await this.accountsRepository.findById(
      investment.accountId,
    );
    if (!account || account.userId !== userId) {
      throw new NotFoundException("Investimento não encontrado");
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.amount !== undefined) updateData.amount = new Decimal(dto.amount);
    if (dto.productType !== undefined) updateData.productType = dto.productType;
    if (dto.note !== undefined) updateData.note = dto.note;

    return this.accountsRepository.updateInvestment(
      investmentId,
      updateData as never,
    );
  }

  async removeInvestment(investmentId: string, userId: string) {
    const investment =
      await this.accountsRepository.findInvestmentById(investmentId);
    if (!investment) {
      throw new NotFoundException("Investimento não encontrado");
    }

    const account = await this.accountsRepository.findById(
      investment.accountId,
    );
    if (!account || account.userId !== userId) {
      throw new NotFoundException("Investimento não encontrado");
    }

    return this.accountsRepository.deleteInvestment(investmentId);
  }

  async transfer(userId: string, dto: TransferDto) {
    const fromAccount = await this.accountsRepository.findByIdAndUser(
      dto.fromAccountId,
      userId,
    );
    if (!fromAccount) {
      throw new NotFoundException("Conta de origem não encontrada");
    }

    const toAccount = await this.accountsRepository.findByIdAndUser(
      dto.toAccountId,
      userId,
    );
    if (!toAccount) {
      throw new NotFoundException("Conta de destino não encontrada");
    }

    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException(
        "Conta de origem e destino não podem ser iguais",
      );
    }

    const amount = new Decimal(dto.amount);
    if (fromAccount.balance.lessThan(amount)) {
      throw new BadRequestException("Saldo insuficiente");
    }

    return this.accountsRepository.createTransfer(
      dto.fromAccountId,
      dto.toAccountId,
      amount,
      dto.description ?? "Transferência entre contas",
      toMidnightUTC(new Date(dto.date)),
      dto.note,
    );
  }

  async getEntries(accountId: string, userId: string) {
    const account = await this.accountsRepository.findByIdAndUser(
      accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException("Conta não encontrada");
    }
    return this.accountsRepository.findEntriesByAccount(accountId);
  }

  async recordEntry(
    accountId: string,
    userId: string,
    entryData: {
      type: AccountEntryType;
      amount: Decimal;
      description: string;
      date: Date;
      budgetItemId?: string;
      transactionId?: string;
      note?: string;
    },
  ) {
    const account = await this.accountsRepository.findByIdAndUser(
      accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException("Conta não encontrada");
    }

    const isCredit =
      entryData.type === "INCOME" || entryData.type === "TRANSFER_IN";
    const balanceDelta = isCredit
      ? entryData.amount
      : new Decimal(entryData.amount.toString()).negated();

    return this.accountsRepository.createEntryAndUpdateBalance(
      accountId,
      {
        account: { connect: { id: accountId } },
        type: entryData.type,
        amount: entryData.amount,
        description: entryData.description,
        date: entryData.date,
        note: entryData.note,
        ...(entryData.budgetItemId
          ? { budgetItem: { connect: { id: entryData.budgetItemId } } }
          : {}),
        ...(entryData.transactionId
          ? { transaction: { connect: { id: entryData.transactionId } } }
          : {}),
      } as never,
      balanceDelta,
    );
  }

  async reverseEntry(budgetItemId: string) {
    const entry =
      await this.accountsRepository.findEntryByBudgetItem(budgetItemId);
    if (!entry) {
      return;
    }
    return this.accountsRepository.reverseEntry(entry.id);
  }
}
