import { asc, desc, gte, sql, and, inArray, lte, or } from "ponder";
import { db } from "ponder:api";
import { accountBalance, transfer } from "ponder:schema";
import { DBAccountBalanceVariation } from "@/api/mappers";
import { Address } from "viem";

export class BalanceVariationsRepository {
  async getAccountBalanceVariations(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    return this.commonQuery(
      fromTimestamp,
      toTimestamp,
      limit,
      skip,
      orderDirection,
      addresses
    )
  }

  async getAccountBalanceVariationsByAccountId(
    address: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
  ): Promise<DBAccountBalanceVariation> {
    const [result] = await this.commonQuery(fromTimestamp, toTimestamp, 1, 0, "desc", [address])
    if (result) return result
    return {
      accountId: address,
      previousBalance: 0n,
      currentBalance: 0n,
      absoluteChange: 0n,
      percentageChange: "0",
    }
  }

  private async commonQuery(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    const scopedTransfers = db
      .select()
      .from(transfer)
      .where(
        and(
          fromTimestamp ? gte(transfer.timestamp, BigInt(fromTimestamp)) : undefined,
          toTimestamp ? lte(transfer.timestamp, BigInt(toTimestamp)) : undefined,
          addresses ? or(
            inArray(transfer.fromAccountId, addresses),
            inArray(transfer.toAccountId, addresses),
          ) : undefined,
        ))
      .as("scoped_transfers");

    const transfersFrom = db
      .select({
        accountId: scopedTransfers.fromAccountId,
        fromAmount: sql<string>`-SUM(${transfer.amount})`.as("from_amount"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.fromAccountId)
      .as("transfers_from");

    const transfersTo = db
      .select({
        accountId: scopedTransfers.toAccountId,
        toAmount: sql<string>`SUM(${transfer.amount})`.as("to_amount"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.toAccountId)
      .as("transfers_to");

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
        (currentBalance - BigInt(absoluteChange)
          ? Number(
            (BigInt(absoluteChange) * 10000n) /
            (currentBalance - BigInt(absoluteChange)),
          ) / 100
          : 0).toString(),
    }));
  }
}
