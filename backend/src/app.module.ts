import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SummaryModule } from './summary/summary.module';
import { ConsolidationModule } from './consolidation/consolidation.module';
import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MembersModule,
    CategoriesModule,
    TransactionsModule,
    SummaryModule,
    ConsolidationModule,
    AccountsModule,
  ],
})
export class AppModule {}
