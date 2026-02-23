import { asc, desc, gte, sql, and, inArray, lte, or, eq } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle, accountBalance, transfer } from "@/database";
import { calculatePercentage } from "@/lib/utils";
import { DBAccountBalanceVariation } from "@/mappers";

export class BalanceVariationsRepository {
  constructor(private readonly db: Drizzle) {}

  async getAccountBalanceVariations(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    const scopedTransfers = this.db
      .select()
      .from(transfer)
      .where(
        and(
          fromTimestamp
            ? gte(transfer.timestamp, BigInt(fromTimestamp))
            : undefined,
          toTimestamp
            ? lte(transfer.timestamp, BigInt(toTimestamp))
            : undefined,
          addresses
            ? or(
                inArray(transfer.fromAccountId, addresses),
                inArray(transfer.toAccountId, addresses),
              )
            : undefined,
        ),
      )
      .as("scoped_transfers");

    const transfersFrom = this.db
      .select({
        accountId: scopedTransfers.fromAccountId,
        fromAmount: sql<string>`-SUM(${scopedTransfers.amount})`.as(
          "from_amount",
        ),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.fromAccountId)
      .as("transfers_from");

    const transfersTo = this.db
      .select({
        accountId: scopedTransfers.toAccountId,
        toAmount: sql<string>`SUM(${scopedTransfers.amount})`.as("to_amount"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.toAccountId)
      .as("transfers_to");

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
        and(
          addresses ? inArray(accountBalance.accountId, addresses) : undefined,
          sql`${transfersFrom.accountId} IS NOT NULL OR ${transfersTo.accountId} IS NOT NULL`,
        ),
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
      percentageChange: calculatePercentage(currentBalance, absoluteChange),
    }));
  }

  async getAccountBalanceVariationsByAccountId(
    address: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
  ): Promise<DBAccountBalanceVariation | undefined> {
    const scopedTransfers = this.db
      .select()
      .from(transfer)
      .where(
        and(
          fromTimestamp
            ? gte(transfer.timestamp, BigInt(fromTimestamp))
            : undefined,
          toTimestamp
            ? lte(transfer.timestamp, BigInt(toTimestamp))
            : undefined,
        ),
      )
      .as("scoped_transfers");

    const transfersFrom = this.db
      .select({
        accountId: scopedTransfers.fromAccountId,
        fromAmount: sql<string>`-SUM(${scopedTransfers.amount})`.as(
          "from_amount",
        ),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.fromAccountId)
      .as("transfers_from");

    const transfersTo = this.db
      .select({
        accountId: scopedTransfers.toAccountId,
        toAmount: sql<string>`SUM(${scopedTransfers.amount})`.as("to_amount"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.toAccountId)
      .as("transfers_to");

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
      .where(eq(accountBalance.accountId, address))
      .as("combined");

    const [result] = await this.db
      .select({
        accountId: combined.accountId,
        currentBalance: combined.currentBalance,
        absoluteChange:
          sql<string>`${combined.fromChange} + ${combined.toChange}`.as(
            "absolute_change",
          ),
      })
      .from(combined)
      .where(sql`(${combined.fromChange} + ${combined.toChange}) != 0`);

    if (!result) return undefined;

    return {
      accountId: result.accountId,
      previousBalance: result.currentBalance - BigInt(result.absoluteChange),
      currentBalance: result.currentBalance,
      absoluteChange: BigInt(result.absoluteChange),
      percentageChange: (result.currentBalance - BigInt(result.absoluteChange)
        ? Number(
            (BigInt(result.absoluteChange) * 10000n) /
              (result.currentBalance - BigInt(result.absoluteChange)),
          ) / 100
        : 0
      ).toString(),
    };
  }
}
