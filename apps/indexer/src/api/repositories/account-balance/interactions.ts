import { Address } from "viem";
import { transfer, accountBalance } from "ponder:schema";
import { asc, desc, gte, sql, and, eq, or, lte } from "drizzle-orm";

import { DrizzleDB } from "@/api/database";
import { AccountInteractions, Filter } from "@/api/mappers";

export class AccountInteractionsRepository {
  constructor(private readonly db: DrizzleDB) {}

  async getAccountInteractions(
    accountId: Address,
    startTimestamp: number,
    limit: number,
    skip: number,
    orderBy: "volume" | "count",
    orderDirection: "asc" | "desc",
    filter: Filter,
  ): Promise<AccountInteractions> {
    // Aggregate outgoing transfers (negative amounts)
    const transferCriteria = [
      gte(transfer.timestamp, BigInt(startTimestamp)),
      or(
        eq(transfer.toAccountId, accountId),
        eq(transfer.fromAccountId, accountId),
      ),
    ];

    if (filter.minAmount !== undefined) {
      transferCriteria.push(gte(transfer.amount, filter.minAmount));
    }

    if (filter.maxAmount !== undefined) {
      transferCriteria.push(lte(transfer.amount, filter.maxAmount));
    }

    if (filter.address) {
      transferCriteria.push(
        or(
          eq(transfer.toAccountId, filter.address),
          eq(transfer.fromAccountId, filter.address),
        ),
      );
    }

    // Aggregate outgoing transfers (negative amounts)
    const scopedTransfers = this.db
      .select()
      .from(transfer)
      .where(and(...transferCriteria))
      .as("scoped_transfers");

    const transfersFrom = this.db
      .select({
        accountId: scopedTransfers.fromAccountId,
        fromAmount: sql<string>`-SUM(${transfer.amount})`.as("from_amount"),
        fromCount: sql<string>`COUNT(*)`.as("from_count"),
      })
      .from(scopedTransfers)
      .groupBy(scopedTransfers.fromAccountId)
      .as("transfers_from");

    // Aggregate incoming transfers (positive amounts)
    const transfersTo = this.db
      .select({
        accountId: scopedTransfers.toAccountId,
        toAmount: sql<string>`SUM(${transfer.amount})`.as("to_amount"),
        toCount: sql<string>`COUNT(*)`.as("to_count"),
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
        sql`${transfersFrom.accountId} IS NOT NULL OR ${transfersTo.accountId} IS NOT NULL AND (${transfersFrom.accountId} != ${transfersTo.accountId})`,
      )
      .as("combined");

    const orderDirectionFn = orderDirection === "desc" ? desc : asc;
    const orderByField =
      orderBy === "count"
        ? sql`${combined.fromCount} + ${combined.toCount}`
        : sql`ABS(${combined.fromChange}) + ABS(${combined.toChange})`;

    const baseQuery = this.db
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
      .orderBy(orderDirectionFn(orderByField));

    const totalCountResult = await this.db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(baseQuery.as("subquery"));

    const pagedResult = await baseQuery.offset(skip).limit(limit);

    return {
      interactionCount: Number(totalCountResult[0]?.count) ?? 0,
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
          percentageChange:
            currentBalance - BigInt(absoluteChange)
              ? Number(
                  (BigInt(absoluteChange) * 10000n) /
                    (currentBalance - BigInt(absoluteChange)),
                ) / 100
              : 0,
        }),
      ),
    };
  }
}
