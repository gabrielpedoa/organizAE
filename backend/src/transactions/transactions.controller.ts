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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtUser } from "../auth/jwt-user.interface";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";

@ApiTags('transactions')
@ApiBearerAuth()
@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactions: TransactionsService) {}

  @Get("rules")
  @ApiOperation({ summary: 'Lista regras de transação. Filtra por ?type' })
  listRules(@CurrentUser() user: JwtUser, @Query("type") type?: string) {
    return this.transactions.listRules(user.id, type);
  }

  @Post("rules")
  @ApiOperation({ summary: 'Cria uma regra e gera as transações correspondentes' })
  createRule(@CurrentUser() user: JwtUser, @Body() dto: CreateRuleDto) {
    return this.transactions.createRule(user.id, dto);
  }

  @Patch("rules/:id")
  @ApiOperation({ summary: 'Atualiza uma regra existente' })
  updateRule(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: UpdateRuleDto,
  ) {
    return this.transactions.updateRule(user.id, id, dto);
  }

  @Delete("rules/:id")
  @ApiOperation({ summary: 'Remove uma regra e suas transações vinculadas' })
  removeRule(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.transactions.removeRule(user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'Lista transações. Filtra por ?month, ?memberId, ?categoryId, ?type' })
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
  @ApiOperation({ summary: 'Cria múltiplas transações em lote' })
  createBulk(
    @CurrentUser() user: JwtUser,
    @Body(new ParseArrayPipe({ items: CreateTransactionDto }))
    dtos: CreateTransactionDto[],
  ) {
    return this.transactions.createBulk(user.id, dtos);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma transação avulsa' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(user.id, dto);
  }

  @Put(":id")
  @ApiOperation({ summary: 'Atualiza uma transação' })
  update(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: Partial<CreateTransactionDto>,
  ) {
    return this.transactions.update(user.id, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: 'Remove uma transação' })
  remove(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.transactions.remove(user.id, id);
  }
}
