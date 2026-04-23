import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsDecimal,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @ApiProperty({ example: 'Nubank' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ example: 'Nubank' })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiPropertyOptional({ example: '1000.00' })
  @IsOptional()
  @IsDecimal()
  initialBalance?: string;

  @ApiPropertyOptional({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}