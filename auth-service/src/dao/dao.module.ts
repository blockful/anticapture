import { Module } from '@nestjs/common';
import { DaoService } from './dao.service';

@Module({
  providers: [DaoService],
  exports: [DaoService],
})
export class DaoModule {}
