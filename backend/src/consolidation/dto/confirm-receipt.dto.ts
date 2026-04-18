import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ConfirmReceiptDto {
  @IsDateString()
  receivedAt: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
