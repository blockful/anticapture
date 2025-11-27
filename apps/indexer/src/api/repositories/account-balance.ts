import { asc, desc, gte, sql, and, inArray, eq, or } from "ponder";
import { db } from "ponder:api";
import { transfer, accountBalance } from "ponder:schema";
import { DBAccountBalanceVariation, DBHistoricalBalance } from "../mappers";
import { Address } from "viem";

export class AccountBalanceRepository {
  async getHistoricalBalances(
    addresses: Address[],
    timestamp: number,
  ): Promise<DBHistoricalBalance[]> {
    const transfersFrom = db
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
    const transfersTo = db
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
      .where(inArray(accountBalance.accountId, addresses))
      .as("combined");

    const result = await db
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
    omitZeroNetVariation: boolean,
  ): Promise<DBAccountBalanceVariation[]> {
    return this.getVariations(
      startTimestamp,
      limit,
      skip,
      orderDirection,
      undefined,
      omitZeroNetVariation,
    );
  }

  async getAccountInteractions(
    accountId: Address,
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    omitZeroNetVariation: boolean,
  ): Promise<DBAccountBalanceVariation[]> {
    return this.getVariations(
      startTimestamp,
      limit,
      skip,
      orderDirection,
      accountId,
      omitZeroNetVariation,
    );
  }

  private async getVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    address?: Address,
    omitZeroNetVariation: boolean = true,
  ): Promise<DBAccountBalanceVariation[]> {
    // Aggregate outgoing transfers (negative amounts)
    const scopedTransfers = db
      .select()
      .from(transfer)
      .where(
        and(
          gte(transfer.timestamp, BigInt(startTimestamp)),
          address
            ? or(
                eq(transfer.toAccountId, address),
                eq(transfer.fromAccountId, address),
              )
            : undefined,
        ),
      )
      .as("scoped_transfers");

    const transfersFrom = db
      .select({
        accountId: scopedTransfers.fromAccountId,
        fromAmount: sql<string>`-SUM(${transfer.amount})`.as("from_amount"),
        fromCount: sql<string>`COUNT(*)`.as("from_count"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.fromAccountId)
      .as("transfers_from");

    // Aggregate incoming transfers (positive amounts)
    const transfersTo = db
      .select({
        accountId: scopedTransfers.toAccountId,
        toAmount: sql<string>`SUM(${transfer.amount})`.as("to_amount"),
        toCount: sql<string>`COUNT(*)`.as("to_count"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.toAccountId)
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
        fromCount: sql<number>`COALESCE(${transfersFrom.fromCount}, 0)`.as(
          "from_count",
        ),
        toCount: sql<number>`COALESCE(${transfersTo.toCount}, 0)`.as(
          "to_count",
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
        totalVolume:
          sql<string>`ABS(${combined.fromChange}) + ABS(${combined.toChange})`.as(
            "total_volume",
          ),
        absoluteChange:
          sql<string>`${combined.fromChange} + ${combined.toChange}`.as(
            "absolute_change",
          ),
        transferCount:
          sql<number>`${combined.fromCount} + ${combined.toCount}`.as(
            "transfer_count",
          ),
      })
      .from(combined)
      .where(
        omitZeroNetVariation
          ? sql`(${combined.fromChange} + ${combined.toChange}) != 0`
          : undefined,
      )
      .orderBy(
        orderDirection === "desc"
          ? desc(sql`ABS(${combined.fromChange} + ${combined.toChange})`)
          : asc(sql`ABS(${combined.fromChange} + ${combined.toChange})`),
      )
      .offset(skip)
      .limit(limit);

    return result.map(
      ({
        accountId,
        currentBalance,
        absoluteChange,
        totalVolume,
        transferCount,
      }) => ({
        accountId: accountId,
        previousBalance: currentBalance - BigInt(absoluteChange),
        currentBalance: currentBalance,
        absoluteChange: BigInt(absoluteChange),
        totalVolume: BigInt(totalVolume),
        transferCount: BigInt(transferCount),
        percentageChange:
          currentBalance - BigInt(absoluteChange)
            ? Number(
                (BigInt(absoluteChange) * 10000n) /
                  (currentBalance - BigInt(absoluteChange)),
              ) / 100
            : 0,
      }),
    );
  }
}
