import { asc, desc, gte, sql, and, eq, or, lte } from "ponder";
import { db } from "ponder:api";
import { transfer, accountBalance } from "ponder:schema";
import { AccountInteractions, AmountFilter } from "../mappers";
import { Address } from "viem";

export class AccountInteractionsRepository {
  async getAccountInteractions(
    accountId: Address,
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    filter: AmountFilter,
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

    // Aggregate outgoing transfers (negative amounts)
    const scopedTransfers = db
      .select()
      .from(transfer)
      .where(and(...transferCriteria))
      .as("scoped_transfers");

    const totalCountResult = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(scopedTransfers);

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
      .orderBy(
        orderDirection === "desc"
          ? desc(sql`${combined.fromCount} + ${combined.toCount}`)
          : asc(sql`${combined.fromCount} + ${combined.toCount}`),
      )
      .offset(skip)
      .limit(limit);

    return {
      interactionCount: Number(totalCountResult[0]?.count) ?? 0,
      interactions: result.map(
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
