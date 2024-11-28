import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { DaoModule } from './dao/dao.module';

@Module({
  imports: [AccountModule, UserModule, RoleModule, DaoModule ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
