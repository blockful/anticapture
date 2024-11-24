import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, PrismaService],
})
export class AccountModule {}
