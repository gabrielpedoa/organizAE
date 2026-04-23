import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AccountType } from '@prisma/client';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @ApiPropertyOptional({ example: 'Nubank' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ example: 'Nubank' })
  @IsOptional()
  @IsString()
  institution?: string;
}