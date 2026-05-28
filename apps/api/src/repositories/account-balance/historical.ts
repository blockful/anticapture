import { gte, and, lte, desc, eq, asc, sql } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle, balanceHistory, transfer } from "@/database";
import { DBHistoricalBalanceWithRelations } from "@/mappers";

export class HistoricalBalanceRepository {
  constructor(private readonly db: Drizzle) {}

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
    fromAddress?: Address,
    toAddress?: Address,
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
          fromAddress ? eq(transfer.fromAccountId, fromAddress) : undefined,
          toAddress ? eq(transfer.toAccountId, toAddress) : undefined,
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
    fromDate?: number,
    toDate?: number,
    fromAddress?: Address,
    toAddress?: Address,
  ): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
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
          fromAddress ? eq(transfer.fromAccountId, fromAddress) : undefined,
          toAddress ? eq(transfer.toAccountId, toAddress) : undefined,
        ),
      );

    return row?.count ?? 0;
  }
}
