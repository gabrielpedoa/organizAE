import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class ConfirmPaymentDto {
  @IsDateString()
  paidAt: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID da conta debitada', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}
