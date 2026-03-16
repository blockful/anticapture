import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  not,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { Address, getAddress } from "viem";

import { Drizzle, accountBalance, transfer } from "@/database";
import { calculatePercentage } from "@/lib/utils";
import {
  AccountInteractions,
  AmountFilter,
  DBAccountBalance,
  DBAccountBalanceWithVariation,
} from "@/mappers";
import { Filter } from "@/mappers/account-balance/general";

import { AccountBalanceQueryFragments } from "./common";

export class AAVEAccountBalanceRepository {
  constructor(
    private readonly db: Drizzle,
    private queryFragments: AccountBalanceQueryFragments,
  ) {}

  async getAccountBalances(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalance[];
    totalCount: bigint;
  }> {
    const filter = this.filterToSql(
      addresses,
      delegates,
      excludeAddresses,
      amountfilter,
    );

    // Get total count with filters
    const totalCount = await this.db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(accountBalance)
      .where(filter);

    // Get paginated results
    const page = await this.db
      .select()
      .from(accountBalance)
      .where(filter)
      .orderBy(
        orderDirection === "desc"
          ? desc(accountBalance.balance)
          : asc(accountBalance.balance),
      )
      .offset(skip)
      .limit(limit);

    return {
      items: page,
      totalCount: BigInt(totalCount[0]?.count ?? 0),
    };
  }

  async getAccountBalance(
    accountId: Address,
  ): Promise<DBAccountBalance | undefined> {
    const [result] = await this.db
      .select()
      .from(accountBalance)
      .where(eq(accountBalance.accountId, accountId))
      .limit(1);

    return result;
  }

  async getAccountBalancesWithVariation(
    variationFromTimestamp: number,
    variationToTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "balance" | "variation" | "signedVariation",
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalanceWithVariation[];
    totalCount: number;
  }> {
    const filter = this.filterToSql(
      addresses,
      delegates,
      excludeAddresses,
      amountfilter,
    );

    const variations = this.queryFragments.variationCTE(
      variationFromTimestamp,
      variationToTimestamp,
      filter,
    );

    const [totalCount] = await this.db
      .select({
        count: sql<number>`COUNT(DISTINCT ${variations.accountId})`.as("count"),
      })
      .from(variations);

    const aggregated = this.db
      .select({
        accountId: variations.accountId,
        currentBalance: sql<bigint>`SUM(${variations.currentBalance})`.as(
          "current_balance",
        ),
        absoluteChange:
          sql<string>`MAX(${variations.fromChange}::numeric) + MAX(${variations.toChange}::numeric)`.as(
            "absolute_change",
          ),
      })
      .from(variations)
      .groupBy(variations.accountId)
      .as("aggregated");

    const orderDirectionFn = orderDirection === "desc" ? desc : asc;

    const orderByCriteria =
      orderBy === "balance"
        ? aggregated.currentBalance
        : orderBy === "signedVariation"
          ? sql`${aggregated.absoluteChange}::numeric`
          : sql`ABS(${aggregated.absoluteChange}::numeric)`;

    const result = await this.db
      .select()
      .from(aggregated)
      .orderBy(orderDirectionFn(orderByCriteria))
      .offset(skip)
      .limit(limit);

    return {
      items: result.map(({ accountId, currentBalance, absoluteChange }) => ({
        accountId: accountId,
        tokenId: getAddress(accountId),
        delegate: getAddress(accountId),
        previousBalance: BigInt(currentBalance) - BigInt(absoluteChange),
        currentBalance: currentBalance,
        absoluteChange: BigInt(absoluteChange),
        percentageChange: calculatePercentage(currentBalance, absoluteChange),
      })),
      totalCount: totalCount?.count ?? 0,
    };
  }

  async getAccountBalanceWithVariation(
    accountId: Address,
    variationFromTimestamp: number,
    variationToTimestamp: number,
  ): Promise<DBAccountBalanceWithVariation | undefined> {
    const filter = eq(accountBalance.accountId, accountId);

    const variations = this.queryFragments.variationCTE(
      variationFromTimestamp,
      variationToTimestamp,
      filter,
    );

    const [result] = await this.db
      .select({
        accountId: variations.accountId,
        currentBalance: sql<string>`SUM(${variations.currentBalance})`.as(
          "current_balance",
        ),
        absoluteChange:
          sql<string>`MAX(${variations.fromChange}::numeric) + MAX(${variations.toChange}::numeric)`.as(
            "absolute_change",
          ),
      })
      .from(variations)
      .groupBy(variations.accountId);

    if (!result) return undefined;

    return {
      accountId: result.accountId,
      tokenId: getAddress(result.accountId),
      delegate: getAddress(result.accountId),
      previousBalance:
        BigInt(result.currentBalance) - BigInt(result.absoluteChange),
      currentBalance: BigInt(result.currentBalance),
      absoluteChange: BigInt(result.absoluteChange),
      percentageChange: calculatePercentage(
        result.currentBalance,
        result.absoluteChange,
      ),
    };
  }

  private filterToSql(
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): SQL | undefined {
    const conditions = [];

    if (addresses.length) {
      conditions.push(inArray(accountBalance.accountId, addresses));
    }

    if (delegates.length) {
      conditions.push(inArray(accountBalance.delegate, delegates));
    }

    if (
      amountfilter.minAmount !== null &&
      amountfilter.minAmount !== undefined
    ) {
      conditions.push(
        gt(accountBalance.balance, BigInt(amountfilter.minAmount)),
      );
    }

    if (
      amountfilter.maxAmount !== null &&
      amountfilter.maxAmount !== undefined
    ) {
      conditions.push(
        lt(accountBalance.balance, BigInt(amountfilter.maxAmount)),
      );
    }

    if (excludeAddresses.length) {
      conditions.push(not(inArray(accountBalance.accountId, excludeAddresses)));
    }

    return and(...conditions);
  }

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
    // GROUP BY accountId to deduplicate accounts that have multiple tokens (e.g. AAVE aToken + sToken)
    const combined = this.db
      .select({
        accountId: accountBalance.accountId,
        currentBalance: sql<bigint>`SUM(${accountBalance.balance})`.as(
          "current_balance",
        ),
        fromChange:
          sql<string>`COALESCE(MAX(${transfersFrom.fromAmount}), 0)`.as(
            "from_change",
          ),
        toChange: sql<string>`COALESCE(MAX(${transfersTo.toAmount}), 0)`.as(
          "to_change",
        ),
        fromCount: sql<number>`COALESCE(MAX(${transfersFrom.fromCount}), 0)`.as(
          "from_count",
        ),
        toCount: sql<number>`COALESCE(MAX(${transfersTo.toCount}), 0)`.as(
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
      .groupBy(accountBalance.accountId)
      .as("combined");

    const subquery = this.db
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

    const baseQuery = this.db
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

    const totalCountResult = await this.db
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
          previousBalance: BigInt(currentBalance) - BigInt(absoluteChange),
          currentBalance: BigInt(currentBalance),
          absoluteChange: BigInt(absoluteChange),
          totalVolume: BigInt(totalVolume),
          transferCount: BigInt(transferCount),
          percentageChange: (BigInt(currentBalance) - BigInt(absoluteChange)
            ? Number(
                (BigInt(absoluteChange) * 10000n) /
                  (BigInt(currentBalance) - BigInt(absoluteChange)),
              ) / 100
            : 0
          ).toString(),
        }),
      ),
    };
  }
}
