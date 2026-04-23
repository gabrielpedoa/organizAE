import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class ConfirmReceiptDto {
  @IsDateString()
  receivedAt: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID da conta creditada', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}
