import { Module } from '@nestjs/common';
import { DaoService } from './dao.service';
import { DaoController } from './dao.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DaoController],
  providers: [DaoService, PrismaService],
})
export class DaoModule {}
