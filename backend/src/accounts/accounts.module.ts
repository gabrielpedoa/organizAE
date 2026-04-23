import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsService],
})
export class AccountsModule {}