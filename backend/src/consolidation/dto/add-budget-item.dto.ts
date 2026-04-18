import {
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

export class AddBudgetItemDto {
  @IsUUID()
  memberId: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  description: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  installmentNumber?: number;

  @IsOptional()
  @IsEnum(['FIXED', 'VARIABLE', 'INVESTMENT', 'TRANSFER'])
  expenseType?: 'FIXED' | 'VARIABLE' | 'INVESTMENT' | 'TRANSFER';

  @IsOptional()
  @IsString()
  note?: string;
}
