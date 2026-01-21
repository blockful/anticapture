import { Address } from "viem";
import { gte, and, lte, desc, eq, asc } from "drizzle-orm";
import { db } from "ponder:api";

import { DBHistoricalBalance } from "@/api/mappers";
import { balanceHistory } from "ponder:schema";

export class HistoricalBalanceRepository {
  async getHistoricalBalances(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBHistoricalBalance[]> {
    return await db
      .select()
      .from(balanceHistory)
      .where(
        and(
          eq(balanceHistory.accountId, accountId),
          minDelta ? gte(balanceHistory.deltaMod, BigInt(minDelta)) : undefined,
          maxDelta ? lte(balanceHistory.deltaMod, BigInt(maxDelta)) : undefined,
          fromDate
            ? gte(balanceHistory.timestamp, BigInt(fromDate))
            : undefined,
          toDate ? lte(balanceHistory.timestamp, BigInt(toDate)) : undefined,
        ),
      )
      .orderBy(
        orderDirection === "asc"
          ? asc(
              orderBy === "timestamp"
                ? balanceHistory.timestamp
                : balanceHistory.deltaMod,
            )
          : desc(
              orderBy === "timestamp"
                ? balanceHistory.timestamp
                : balanceHistory.deltaMod,
            ),
      )
      .limit(limit)
      .offset(skip);
  }

  async getHistoricalBalanceCount(
    accountId: Address,
    minDelta?: string,
    maxDelta?: string,
  ): Promise<number> {
    return await db.$count(
      balanceHistory,
      and(
        eq(balanceHistory.accountId, accountId),
        minDelta ? gte(balanceHistory.deltaMod, BigInt(minDelta)) : undefined,
        maxDelta ? lte(balanceHistory.deltaMod, BigInt(maxDelta)) : undefined,
      ),
    );
  }
}
