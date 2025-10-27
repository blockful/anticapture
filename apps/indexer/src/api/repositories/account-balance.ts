import { asc, desc, gte, sql } from "ponder";
import { db } from "ponder:api";
import { transfer, accountBalance } from "ponder:schema";
import { DBAccountBalanceVariation } from "../mappers";

export class AccountBalanceRepository {
  async getTopAccountBalanceVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    // Aggregate outgoing transfers (negative amounts)
    const transfersFrom = db
      .select({
        accountId: transfer.fromAccountId,
        fromAmount: sql<string>`-SUM(${transfer.amount})`.as("from_amount"),
      })
      .from(transfer)
      .where(gte(transfer.timestamp, BigInt(startTimestamp)))
      .groupBy(transfer.fromAccountId)
      .as("transfers_from");

    // Aggregate incoming transfers (positive amounts)
    const transfersTo = db
      .select({
        accountId: transfer.toAccountId,
        toAmount: sql<string>`SUM(${transfer.amount})`.as("to_amount"),
      })
      .from(transfer)
      .where(gte(transfer.timestamp, BigInt(startTimestamp)))
      .groupBy(transfer.toAccountId)
      .as("transfers_to");

    // Combine both aggregations
    const combined = db
      .select({
        accountId: accountBalance.accountId,
        currentBalance: accountBalance.balance,
        fromChange: sql<string>`COALESCE(${transfersFrom.fromAmount}, 0)`.as(
          "from_change",
        ),
        toChange: sql<string>`COALESCE(${transfersTo.toAmount}, 0)`.as(
          "to_change",
        ),
      })
      .from(accountBalance)
      .leftJoin(
        transfersFrom,
        sql`${accountBalance.accountId} = ${transfersFrom.accountId}`,
      )
      .leftJoin(
        transfersTo,
        sql`${accountBalance.accountId} = ${transfersTo.accountId}`,
      )
      .where(
        sql`${transfersFrom.accountId} IS NOT NULL OR ${transfersTo.accountId} IS NOT NULL`,
      )
      .as("combined");

    const result = await db
      .select({
        accountId: combined.accountId,
        currentBalance: combined.currentBalance,
        absoluteChange:
          sql<string>`${combined.fromChange} + ${combined.toChange}`.as(
            "absolute_change",
          ),
      })
      .from(combined)
      .where(sql`(${combined.fromChange} + ${combined.toChange}) != 0`)
      .orderBy(
        orderDirection === "desc"
          ? desc(sql`ABS(${combined.fromChange} + ${combined.toChange})`)
          : asc(sql`ABS(${combined.fromChange} + ${combined.toChange})`),
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
