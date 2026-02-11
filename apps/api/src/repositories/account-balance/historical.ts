import { Address } from "viem";
import { gte, and, lte, desc, eq, asc, sql } from "drizzle-orm";
import { Drizzle } from "@/database";

import { DBHistoricalBalanceWithRelations } from "@/mappers";
import { balanceHistory, transfer } from "@/database";

export class HistoricalBalanceRepository {
  constructor(private readonly db: Drizzle) { }

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
  ): Promise<DBHistoricalBalanceWithRelations[]> {
    const result = await this.db
      .select()
      .from(balanceHistory)
      .innerJoin(
        transfer,
        sql`${balanceHistory.transactionHash} = ${transfer.transactionHash} AND ${balanceHistory.logIndex} = ${transfer.logIndex}`,
      )
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

    return result.map((row) => ({
      ...row.balance_history,
      transfer: row.transfers,
    }));
  }

  async getHistoricalBalanceCount(
    accountId: Address,
    minDelta?: string,
    maxDelta?: string,
  ): Promise<number> {
    return await this.db.$count(
      balanceHistory,
      and(
        eq(balanceHistory.accountId, accountId),
        minDelta ? gte(balanceHistory.deltaMod, BigInt(minDelta)) : undefined,
        maxDelta ? lte(balanceHistory.deltaMod, BigInt(maxDelta)) : undefined,
      ),
    );
  }
}
