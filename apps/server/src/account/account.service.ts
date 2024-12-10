import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  findMany(params: { skip?: number; take?: number }) {
    const { skip, take } = params;
    return this.prisma.account.findMany({
      include: {
        accountBalances: true,
        accountPowerObj: true,
        delegateeDels: true,
        delegatorDels: true,
        proposalsOnchain: true,
        transfersFrom: true,
        transfersTo: true,
        votesOnchain: true,
        votingPowerHistory: true,
      },
      skip,
      take,
    });
  }

  findOne(id: string) {
    return this.prisma.account.findUnique({
      include: {
        accountBalances: true,
        accountPowerObj: true,
        delegateeDels: true,
        delegatorDels: true,
        proposalsOnchain: true,
        transfersFrom: true,
        transfersTo: true,
        votesOnchain: true,
        votingPowerHistory: true,
      },
      where: {
        id,
      },
    });
  }
}
