import { Address } from "viem";
import { transfer, accountBalance } from "ponder:schema";
import { asc, desc, gte, sql, and, inArray } from "drizzle-orm";

import { DrizzleDB } from "@/api/database";
import { DBAccountBalanceVariation, DBHistoricalBalance } from "@/api/mappers";

export class AccountBalanceRepository {
  constructor(private readonly db: DrizzleDB) {}

  async getHistoricalBalances(
    addresses: Address[],
    timestamp: number,
  ): Promise<DBHistoricalBalance[]> {
    const transfersFrom = this.db
      .select({
        accountId: transfer.fromAccountId,
        fromAmount: sql<string>`-SUM(${transfer.amount})`.as("from_amount"),
      })
      .from(transfer)
      .where(
        and(
          gte(transfer.timestamp, BigInt(timestamp)),
          inArray(transfer.fromAccountId, addresses),
        ),
      )
      .groupBy(transfer.fromAccountId)
      .as("transfers_from");

    // Aggregate incoming transfers (positive amounts)
    const transfersTo = this.db
      .select({
        accountId: transfer.toAccountId,
        toAmount: sql<string>`SUM(${transfer.amount})`.as("to_amount"),
      })
      .from(transfer)
      .where(
        and(
          gte(transfer.timestamp, BigInt(timestamp)),
          inArray(transfer.toAccountId, addresses),
        ),
      )
      .groupBy(transfer.toAccountId)
      .as("transfers_to");

    // Combine both aggregations
    const combined = this.db
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
      .where(inArray(accountBalance.accountId, addresses))
      .as("combined");

    const result = await this.db
      .select({
        address: combined.accountId,
        balance:
          sql<string>`${combined.currentBalance} - (${combined.fromChange} + ${combined.toChange})`.as(
            "balance",
          ),
      })
      .from(combined);

    return result;
  }

  async getAccountBalanceVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    // Aggregate outgoing transfers (negative amounts)
    const scopedTransfers = this.db
      .select()
      .from(transfer)
      .where(gte(transfer.timestamp, BigInt(startTimestamp)))
      .as("scoped_transfers");

    const transfersFrom = this.db
      .select({
        accountId: scopedTransfers.fromAccountId,
        fromAmount: sql<string>`-SUM(${transfer.amount})`.as("from_amount"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.fromAccountId)
      .as("transfers_from");

    // Aggregate incoming transfers (positive amounts)
    const transfersTo = this.db
      .select({
        accountId: scopedTransfers.toAccountId,
        toAmount: sql<string>`SUM(${transfer.amount})`.as("to_amount"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.toAccountId)
      .as("transfers_to");

    // Combine both aggregations
    const combined = this.db
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

    const result = await this.db
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
