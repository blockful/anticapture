import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  lt,
  not,
  SQL,
  sql,
} from "drizzle-orm";
import { Address, getAddress } from "viem";

import { Drizzle, accountBalance } from "@/database";
import { calculatePercentage } from "@/lib/utils";
import {
  AmountFilter,
  DBAccountBalance,
  DBAccountBalanceWithVariation,
} from "@/mappers";

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
          sql<string>`SUM(${variations.fromChange} + ${variations.toChange})`.as(
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
          sql<string>`SUM(${variations.fromChange} + ${variations.toChange})`.as(
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
}
