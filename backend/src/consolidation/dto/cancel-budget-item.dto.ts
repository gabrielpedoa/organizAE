import { IsOptional, IsString } from 'class-validator';

export class CancelBudgetItemDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
