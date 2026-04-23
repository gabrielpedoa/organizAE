import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDecimal } from 'class-validator';
import { InvestmentProductType } from '@prisma/client';
import { CreateInvestmentDto } from './create-investment.dto';

export class UpdateInvestmentDto extends PartialType(CreateInvestmentDto) {
  @ApiPropertyOptional({ example: 'Tesouro Direto' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: InvestmentProductType })
  @IsOptional()
  @IsEnum(InvestmentProductType)
  productType?: InvestmentProductType;

  @ApiPropertyOptional({ example: '5000.00' })
  @IsOptional()
  @IsDecimal()
  amount?: string;

  @ApiPropertyOptional({ example: 'Resgate em 2027' })
  @IsOptional()
  @IsString()
  note?: string;
}