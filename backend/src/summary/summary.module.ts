import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { SummaryRepository } from './summary.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SummaryController],
  providers: [SummaryService, SummaryRepository],
  exports: [SummaryService],
})
export class SummaryModule {}
