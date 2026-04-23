import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt-user.interface';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { TransferDto } from './dto/transfer.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as contas do usuário com investimentos' })
  @ApiResponse({ status: 200, description: 'Contas retornadas com sucesso' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.accountsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova conta' })
  @ApiResponse({ status: 201, description: 'Conta criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(user.id, dto);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfere valor entre duas contas' })
  @ApiResponse({ status: 201, description: 'Transferência realizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Saldo insuficiente ou contas inválidas' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  transfer(@CurrentUser() user: JwtUser, @Body() dto: TransferDto) {
    return this.accountsService.transfer(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna uma conta específica' })
  @ApiResponse({ status: 200, description: 'Conta retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.accountsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza nome, instituição ou tipo da conta' })
  @ApiResponse({ status: 200, description: 'Conta atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma conta e todos seus registros' })
  @ApiResponse({ status: 200, description: 'Conta removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.accountsService.remove(id, user.id);
  }

  @Get(':id/entries')
  @ApiOperation({ summary: 'Lista as últimas 50 movimentações da conta' })
  @ApiResponse({ status: 200, description: 'Movimentações retornadas' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  getEntries(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.accountsService.getEntries(id, user.id);
  }

  @Post(':id/investments')
  @ApiOperation({ summary: 'Adiciona posição de investimento à conta' })
  @ApiResponse({ status: 201, description: 'Investimento criado com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  createInvestment(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateInvestmentDto,
  ) {
    return this.accountsService.createInvestment(id, user.id, dto);
  }

  @Patch('investments/:investmentId')
  @ApiOperation({ summary: 'Atualiza valor ou detalhes de um investimento' })
  @ApiResponse({ status: 200, description: 'Investimento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Investimento não encontrado' })
  updateInvestment(
    @Param('investmentId') investmentId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateInvestmentDto,
  ) {
    return this.accountsService.updateInvestment(investmentId, user.id, dto);
  }

  @Delete('investments/:investmentId')
  @ApiOperation({ summary: 'Remove uma posição de investimento' })
  @ApiResponse({ status: 200, description: 'Investimento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Investimento não encontrado' })
  removeInvestment(
    @Param('investmentId') investmentId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.accountsService.removeInvestment(investmentId, user.id);
  }
}