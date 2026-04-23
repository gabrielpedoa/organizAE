import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt-user.interface';
import { SummaryService } from './summary.service';

@ApiTags('summary')
@ApiBearerAuth()
@Controller('summary')
@UseGuards(JwtAuthGuard)
export class SummaryController {
  constructor(private summary: SummaryService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna resumo financeiro do mês. Parâmetro obrigatório: ?month=YYYY-MM' })
  get(@CurrentUser() user: JwtUser, @Query('month') month: string) {
    const m = month || new Date().toISOString().slice(0, 7);
    return this.summary.getSummary(user.id, m);
  }
}
