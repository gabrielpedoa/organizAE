import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDecimal } from 'class-validator';
import { InvestmentProductType } from '@prisma/client';

export class CreateInvestmentDto {
  @ApiProperty({ example: 'Tesouro Direto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: InvestmentProductType, example: InvestmentProductType.FIXED_INCOME })
  @IsEnum(InvestmentProductType)
  productType: InvestmentProductType;

  @ApiProperty({ example: '5000.00' })
  @IsDecimal()
  amount: string;

  @ApiPropertyOptional({ example: 'Resgate em 2027' })
  @IsOptional()
  @IsString()
  note?: string;
}