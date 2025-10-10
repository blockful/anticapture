import { asc, desc, gte, sql } from "ponder";
import { db } from "ponder:api";
import { transfer, accountBalance } from "ponder:schema";

import { DBAccountBalanceVariation } from "../mappers/top-account-balance-variations";

export class AccountBalanceRepository {
  async getTopAccountBalanceVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    const recentTxs = db
      .select()
      .from(transfer)
      .where(gte(transfer.timestamp, BigInt(startTimestamp)))
      .orderBy(desc(transfer.timestamp))
      .as("recent_txs");

    const aggregated = db
      .select({
        address: accountBalance.accountId,
        balance: accountBalance.balance,
        txsFrom:
          sql<string>`coalesce(sum(case when ${accountBalance.accountId} = ${recentTxs.fromAccountId} then ${recentTxs.amount} else 0 end), 0)`.as(
            "txsFrom",
          ),
        txsTo:
          sql<string>`coalesce(sum(case when ${accountBalance.accountId} = ${recentTxs.toAccountId} then ${recentTxs.amount} else 0 end), 0)`.as(
            "txsTo",
          ),
      })
      .from(accountBalance)
      .leftJoin(
        recentTxs,
        sql`${accountBalance.accountId} = ${recentTxs.fromAccountId} OR ${accountBalance.accountId} = ${recentTxs.toAccountId}`,
      )
      .where(sql`${recentTxs.transactionHash} is not null`)
      .groupBy(accountBalance.accountId, accountBalance.balance)
      .as("aggregated");

    const result = await db
      .select({
        accountId: aggregated.address,
        currentBalance: aggregated.balance,
        absoluteChange:
          sql<string>`${aggregated.txsTo} - ${aggregated.txsFrom}`.as(
            "absoluteChange",
          ),
      })
      .from(aggregated)
      .orderBy(
        orderDirection == "desc"
          ? desc(sql`${aggregated.txsTo} - ${aggregated.txsFrom}`)
          : asc(sql`${aggregated.txsTo} - ${aggregated.txsFrom}`),
      )
      .offset(skip)
      .limit(limit);

    return result.map(({ accountId, currentBalance, absoluteChange }) => ({
      accountId: accountId,
      previousBalance: currentBalance - BigInt(absoluteChange),
      currentBalance: currentBalance,
      absoluteChange: BigInt(absoluteChange),
      percentageChange:
        currentBalance - BigInt(absoluteChange)
          ? Number(
              (BigInt(absoluteChange) * 10000n) /
                (currentBalance - BigInt(absoluteChange)),
            ) / 100
          : 0,
    }));
  }
}
