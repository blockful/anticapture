import { asc, desc, sql, and, inArray, eq } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle, accountBalance } from "@/database";
import { calculatePercentage } from "@/lib/utils";
import { DBAccountBalanceVariation } from "@/mappers";

import { AccountBalanceQueryFragments } from "./common";

export class BalanceVariationsRepository {
  constructor(
    private readonly db: Drizzle,
    private readonly queryFragments: AccountBalanceQueryFragments,
  ) {}

  async getAccountBalanceVariations(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    const filter = and(
      addresses ? inArray(accountBalance.accountId, addresses) : undefined,
    );
    const variations = this.queryFragments.variationCTE(
      fromTimestamp,
      toTimestamp,
      filter,
    );

    const result = await this.db
      .select({
        accountId: variations.accountId,
        currentBalance: variations.currentBalance,
        absoluteChange:
          sql<string>`${variations.fromChange} + ${variations.toChange}`.as(
            "absolute_change",
          ),
      })
      .from(variations)
      .where(sql`(${variations.fromChange} + ${variations.toChange}) != 0`)
      .orderBy(
        orderDirection === "desc"
          ? desc(sql`ABS(${variations.fromChange} + ${variations.toChange})`)
          : asc(sql`ABS(${variations.fromChange} + ${variations.toChange})`),
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
    const filter = eq(accountBalance.accountId, address);

    const combined = this.queryFragments.variationCTE(
      fromTimestamp,
      toTimestamp,
      filter,
    );

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
      percentageChange: calculatePercentage(
        result.currentBalance,
        result.absoluteChange,
      ),
    };
  }
}
