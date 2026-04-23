import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsolidationController } from './consolidation.controller';
import { ConsolidationRepository } from './consolidation.repository';
import { ConsolidationService } from './consolidation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConsolidationController],
  providers: [ConsolidationService, ConsolidationRepository],
  exports: [ConsolidationService],
})
export class ConsolidationModule {}
