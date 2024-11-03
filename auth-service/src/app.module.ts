import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DaoModule } from './dao/dao.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, DaoModule, RolesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
