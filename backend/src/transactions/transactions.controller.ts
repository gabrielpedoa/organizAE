import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtUser } from "../auth/jwt-user.interface";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactions: TransactionsService) {}

  @Get("rules")
  listRules(@CurrentUser() user: JwtUser, @Query("type") type?: string) {
    return this.transactions.listRules(user.id, type);
  }

  @Post("rules")
  createRule(@CurrentUser() user: JwtUser, @Body() dto: CreateRuleDto) {
    return this.transactions.createRule(user.id, dto);
  }

  @Patch("rules/:id")
  updateRule(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: UpdateRuleDto,
  ) {
    return this.transactions.updateRule(user.id, id, dto);
  }

  @Delete("rules/:id")
  removeRule(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.transactions.removeRule(user.id, id);
  }

  @Get()
  list(
    @CurrentUser() user: JwtUser,
    @Query("month") month?: string,
    @Query("memberId") memberId?: string,
    @Query("categoryId") categoryId?: string,
    @Query("type") type?: string,
  ) {
    return this.transactions.list(user.id, month, memberId, categoryId, type);
  }

  @Post("bulk")
  createBulk(
    @CurrentUser() user: JwtUser,
    @Body(new ParseArrayPipe({ items: CreateTransactionDto }))
    dtos: CreateTransactionDto[],
  ) {
    return this.transactions.createBulk(user.id, dtos);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(user.id, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: Partial<CreateTransactionDto>,
  ) {
    return this.transactions.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.transactions.remove(user.id, id);
  }
}
