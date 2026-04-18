import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SummaryModule } from './summary/summary.module';
import { ConsolidationModule } from './consolidation/consolidation.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MembersModule,
    CategoriesModule,
    TransactionsModule,
    SummaryModule,
    ConsolidationModule,
  ],
})
export class AppModule {}
