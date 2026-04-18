import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsolidationController } from './consolidation.controller';
import { ConsolidationService } from './consolidation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConsolidationController],
  providers: [ConsolidationService],
  exports: [ConsolidationService],
})
export class ConsolidationModule {}
