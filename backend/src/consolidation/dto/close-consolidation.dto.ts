import { IsBoolean, IsOptional } from 'class-validator';

export class CloseConsolidationDto {
  /** When true, closes the period even if PENDING items remain. */
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
