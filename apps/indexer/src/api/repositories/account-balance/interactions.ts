import { Address } from "viem";
import { asc, desc, gte, sql, and, eq, or, gt, lt, lte } from "ponder";
import { db } from "ponder:api";
import { transfer, accountBalance } from "ponder:schema";

import { AccountInteractions, Filter } from "../../mappers";

export class AccountInteractionsRepository {
  async getAccountInteractions(
    accountId: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    limit: number,
    skip: number,
    orderBy: "volume" | "count",
    orderDirection: "asc" | "desc",
    filter: Filter,
  ): Promise<AccountInteractions> {
    // Aggregate outgoing transfers (negative amounts)
    const transferCriteria = [
      fromTimestamp
        ? gte(transfer.timestamp, BigInt(fromTimestamp))
        : undefined,
      toTimestamp ? lte(transfer.timestamp, BigInt(toTimestamp)) : undefined,
      or(
        eq(transfer.toAccountId, accountId),
        eq(transfer.fromAccountId, accountId),
      ),
    ];

    if (filter.address) {
      transferCriteria.push(
        or(
          eq(transfer.toAccountId, filter.address),
          eq(transfer.fromAccountId, filter.address),
        ),
      );
    }

    // Aggregate outgoing transfers (negative amounts)
    const scopedTransfers = db
      .select()
      .from(transfer)
      .where(and(...transferCriteria))
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
        sql`(${transfersFrom.accountId} IS NOT NULL OR ${transfersTo.accountId} IS NOT NULL) AND ${accountBalance.accountId} != ${accountId}`,
      )
      .as("combined");

    const subquery = db
      .select({
        accountId: combined.accountId,
        currentBalance: combined.currentBalance,
        fromChange: combined.fromChange,
        toChange: combined.toChange,
        fromCount: combined.fromCount,
        toCount: combined.toCount,
        totalVolume:
          sql<bigint>`ABS(${combined.fromChange}) + ABS(${combined.toChange})`.as(
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
      .as("subquery");

    const orderDirectionFn = orderDirection === "desc" ? desc : asc;
    const orderByField =
      orderBy === "count"
        ? sql`${subquery.fromCount} + ${subquery.toCount}`
        : sql`ABS(${subquery.fromChange}) + ABS(${subquery.toChange})`;

    const baseQuery = db
      .select()
      .from(subquery)
      .where(
        and(
          filter.minAmount
            ? gt(subquery.totalVolume, filter.minAmount)
            : undefined,
          filter.maxAmount
            ? lt(subquery.totalVolume, filter.maxAmount)
            : undefined,
        ),
      )
      .orderBy(orderDirectionFn(orderByField));

    const totalCountResult = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(baseQuery.as("subquery"));

    const pagedResult = await baseQuery.offset(skip).limit(limit);

    return {
      interactionCount: totalCountResult[0]?.count
        ? Number(totalCountResult[0].count)
        : 0,
      interactions: pagedResult.map(
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
          percentageChange: (currentBalance - BigInt(absoluteChange)
            ? Number(
              (BigInt(absoluteChange) * 10000n) /
              (currentBalance - BigInt(absoluteChange)),
            ) / 100
            : 0
          ).toString(),
        }),
      ),
    };
  }
}
