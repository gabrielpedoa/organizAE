import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(['FIXED', 'VARIABLE', 'INVESTMENT', 'TRANSFER'])
  expenseType?: 'FIXED' | 'VARIABLE' | 'INVESTMENT' | 'TRANSFER' | null;

  @IsOptional()
  @IsEnum(['MONTHLY', 'WEEKLY', 'YEARLY'])
  recurrence?: 'MONTHLY' | 'WEEKLY' | 'YEARLY';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalInstallments?: number;

  @IsOptional()
  @IsBoolean()
  isVariable?: boolean;
}
