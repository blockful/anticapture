import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

Decimal.set({ toExpPos: 78, precision: 78 });

export const ExtendedPrismaClient = class {
  constructor() {
    return new PrismaClient();
  }
} as new () => PrismaClient;
