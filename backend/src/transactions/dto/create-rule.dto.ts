import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, IsInt, Min } from 'class-validator';

export class CreateRuleDto {
  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @IsUUID()
  memberId: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(['RECURRING', 'INSTALLMENT'])
  ruleType: 'RECURRING' | 'INSTALLMENT';

  @IsOptional()
  @IsEnum(['MONTHLY', 'WEEKLY', 'YEARLY'])
  recurrence?: 'MONTHLY' | 'WEEKLY' | 'YEARLY';

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  totalInstallments?: number;

  @IsOptional()
  @IsBoolean()
  isVariable?: boolean;

  @IsOptional()
  @IsEnum(['FIXED', 'VARIABLE', 'INVESTMENT', 'TRANSFER'])
  expenseType?: 'FIXED' | 'VARIABLE' | 'INVESTMENT' | 'TRANSFER';
}
