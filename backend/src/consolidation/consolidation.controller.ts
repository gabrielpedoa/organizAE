import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtUser } from "../auth/jwt-user.interface";
import { ConsolidationService } from "./consolidation.service";
import { AddBudgetItemDto } from "./dto/add-budget-item.dto";
import { CancelBudgetItemDto } from "./dto/cancel-budget-item.dto";
import { CloseConsolidationDto } from "./dto/close-consolidation.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { ConfirmReceiptDto } from "./dto/confirm-receipt.dto";
import { GenerateConsolidationDto } from "./dto/generate-consolidation.dto";
import { UpdateBudgetItemDto } from "./dto/update-budget-item.dto";

@Controller("consolidations")
@UseGuards(JwtAuthGuard)
export class ConsolidationController {
  constructor(private consolidation: ConsolidationService) {}

  // ── Consolidation endpoints ───────────────────────────────────────────────

  /** Returns the consolidation for a given month/year, or null if none exists yet. */
  @Get()
  findByMonthYear(
    @CurrentUser() user: JwtUser,
    @Query("month") month: string,
    @Query("year") year: string,
  ) {
    return this.consolidation.findByMonthYear(user.id, Number(month), Number(year));
  }

  /** Generates (or refreshes) BudgetItems for the given month/year. Idempotent. */
  @Post("generate")
  generate(
    @CurrentUser() user: JwtUser,
    @Body() dto: GenerateConsolidationDto,
  ) {
    return this.consolidation.generateMonthlyConsolidation(
      user.id,
      dto.month,
      dto.year,
    );
  }

  /** Full summary: planned vs realised, by category, by member, items by status. */
  @Get(":id/summary")
  summary(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.consolidation.getConsolidationSummary(user.id, id);
  }

  /** Closes the period. Rejects if PENDING items remain unless force=true. */
  @Post(":id/close")
  close(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: CloseConsolidationDto,
  ) {
    return this.consolidation.closeConsolidation(user.id, id, dto.force);
  }

  /** Adds a manually-created (avulso) BudgetItem to the consolidation. */
  @Post(":id/items")
  addItem(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: AddBudgetItemDto,
  ) {
    return this.consolidation.addBudgetItem(user.id, id, {
      ...dto,
      dueDate: new Date(dto.dueDate),
    });
  }

  // ── BudgetItem endpoints ──────────────────────────────────────────────────

  /** Edits amount / description / dueDate of a PENDING item. */
  @Patch("items/:itemId")
  updateItem(
    @CurrentUser() user: JwtUser,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateBudgetItemDto,
  ) {
    const { dueDate, ...rest } = dto;
    return this.consolidation.updateBudgetItem(user.id, itemId, {
      ...rest,
      ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : new Date()),
    });
  }

  /** Confirms payment of an EXPENSE item. Creates a real Transaction. */
  @Post("items/:itemId/pay")
  confirmPayment(
    @CurrentUser() user: JwtUser,
    @Param("itemId") itemId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.consolidation.confirmPayment(user.id, itemId, {
      paidAt: new Date(dto.paidAt),
      amount: dto.amount,
      note: dto.note,
    });
  }

  /** Confirms receipt of an INCOME item. Creates a real Transaction. */
  @Post("items/:itemId/receive")
  confirmReceipt(
    @CurrentUser() user: JwtUser,
    @Param("itemId") itemId: string,
    @Body() dto: ConfirmReceiptDto,
  ) {
    return this.consolidation.confirmReceipt(user.id, itemId, {
      receivedAt: new Date(dto.receivedAt),
      amount: dto.amount,
      note: dto.note,
    });
  }

  /** Cancels a BudgetItem. If already confirmed, reverses (deletes) the Transaction. */
  @Post("items/:itemId/cancel")
  cancelItem(
    @CurrentUser() user: JwtUser,
    @Param("itemId") itemId: string,
    @Body() dto: CancelBudgetItemDto,
  ) {
    return this.consolidation.cancelBudgetItem(user.id, itemId, dto.reason);
  }
}
