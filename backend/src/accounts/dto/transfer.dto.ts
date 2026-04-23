import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDecimal, IsDateString, IsOptional, IsString } from 'class-validator';

export class TransferDto {
  @ApiProperty({ description: 'ID da conta de origem', example: 'uuid-from' })
  @IsUUID()
  fromAccountId: string;

  @ApiProperty({ description: 'ID da conta de destino', example: 'uuid-to' })
  @IsUUID()
  toAccountId: string;

  @ApiProperty({ example: '1000.00' })
  @IsDecimal()
  amount: string;

  @ApiProperty({ example: '2026-04-23' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Transferência para reserva' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Transferência mensal' })
  @IsOptional()
  @IsString()
  note?: string;
}