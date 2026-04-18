import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @IsDateString()
  paidAt: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
