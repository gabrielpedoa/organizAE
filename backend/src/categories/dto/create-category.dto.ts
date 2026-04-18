import { IsEnum, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';
}
