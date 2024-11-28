

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function extendPrismaClient() {
  const prisma = new PrismaClient();
  return prisma.$extends({
    result: {
      accountBalance: {
        balance: {
          needs: { balance: true },
          compute(accountBalance) {
            return new Decimal(accountBalance.balance)
              .toPrecision(78)
              .split('.')[0];
          },
        },
      },
      accountPower: {
        votingPower: {
          needs: { votingPower: true },
          compute(accountPower) {
            return new Decimal(accountPower.votingPower)
              .toPrecision(78)
              .split('.')[0];
          },
        },
      },
      dAO: {
        quorum: {
          needs: { quorum: true },
          compute(dao) {
            return new Decimal(dao.quorum).toPrecision(78).split('.')[0];
          },
        },
        proposalThreshold: {
          needs: { proposalThreshold: true },
          compute(dao) {
            return new Decimal(dao.proposalThreshold)
              .toPrecision(78)
              .split('.')[0];
          },
        },
        votingDelay: {
          needs: { votingDelay: true },
          compute(dao) {
            return new Decimal(dao.votingDelay).toPrecision(78).split('.')[0];
          },
        },
        votingPeriod: {
          needs: { votingPeriod: true },
          compute(dao) {
            return new Decimal(dao.votingPeriod).toPrecision(78).split('.')[0];
          },
        },
        timelockDelay: {
          needs: { timelockDelay: true },
          compute(dao) {
            return new Decimal(dao.timelockDelay).toPrecision(78).split('.')[0];
          },
        },
      },
      delegations: {
        timestamp: {
          needs: { timestamp: true },
          compute(del) {
            return new Decimal(del.timestamp).toPrecision(78).split('.')[0];
          },
        },
      },
      proposalsOnchain: {
        timestamp: {
          needs: { timestamp: true },
          compute(prop) {
            return new Decimal(prop.timestamp).toPrecision(78).split('.')[0];
          },
        },
        forVotes: {
          needs: { forVotes: true },
          compute(prop) {
            return new Decimal(prop.forVotes).toPrecision(78).split('.')[0];
          },
        },
        againstVotes: {
          needs: { againstVotes: true },
          compute(prop) {
            return new Decimal(prop.againstVotes).toPrecision(78).split('.')[0];
          },
        },
        abstainVotes: {
          needs: { abstainVotes: true },
          compute(prop) {
            return new Decimal(prop.abstainVotes).toPrecision(78).split('.')[0];
          },
        },
      },
      token: {
        totalSupply: {
          needs: { totalSupply: true },
          compute(token) {
            return new Decimal(token.totalSupply).toPrecision(78).split('.')[0];
          },
        },
      },
      transfers: {
        amount: {
          needs: { amount: true },
          compute(transfer) {
            return new Decimal(transfer.amount).toPrecision(78).split('.')[0];
          },
        },
        timestamp: {
          needs: { timestamp: true },
          compute(transfer) {
            return new Decimal(transfer.timestamp)
              .toPrecision(78)
              .split('.')[0];
          },
        },
      },
      votesOnchain: {
        timestamp: {
          needs: { timestamp: true },
          compute(vote) {
            return new Decimal(vote.timestamp).toPrecision(78).split('.')[0];
          },
        },
      },
      votingPowerHistory: {
        votingPower: {
          needs: { votingPower: true },
          compute(votingPH) {
            return new Decimal(votingPH.votingPower)
              .toPrecision(78)
              .split('.')[0];
          },
        },
        timestamp: {
          needs: { timestamp: true },
          compute(votingPH) {
            return new Decimal(votingPH.timestamp)
              .toPrecision(78)
              .split('.')[0];
          },
        },
      },
    },
  });
}

export const ExtendedPrismaClient = class {
  constructor() {
    return extendPrismaClient();
  }
} as new () => ReturnType<typeof extendPrismaClient>;
