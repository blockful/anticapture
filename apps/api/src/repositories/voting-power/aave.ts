import {
  and,
  desc,
  eq,
  asc,
  sql,
  SQL,
  inArray,
  gt,
  lt,
  gte,
  lte,
} from "drizzle-orm";
import { Address } from "viem";

import {
  Drizzle,
  votingPowerHistory,
  accountPower,
  accountBalance,
} from "@/database";
import {
  AmountFilter,
  DBAccountPowerWithVariation,
  DBHistoricalVotingPowerWithRelations,
} from "@/mappers";
import { PERCENTAGE_NO_BASELINE } from "@/mappers/constants";

import { getHistoricalVotingPowersWithRelations } from "./historical-query";

export class AAVEVotingPowerRepository {
  constructor(private readonly db: Drizzle) {}

  async getHistoricalVotingPowerCount(
    accountId?: Address,
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<number> {
    return await this.db.$count(
      votingPowerHistory,
      and(
        accountId ? eq(votingPowerHistory.accountId, accountId) : undefined,
        minDelta
          ? gte(votingPowerHistory.deltaMod, BigInt(minDelta))
          : undefined,
        maxDelta
          ? lte(votingPowerHistory.deltaMod, BigInt(maxDelta))
          : undefined,
        fromDate
          ? gte(votingPowerHistory.timestamp, BigInt(fromDate))
          : undefined,
        toDate ? lte(votingPowerHistory.timestamp, BigInt(toDate)) : undefined,
      ),
    );
  }

  async getHistoricalVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    accountId?: Address,
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBHistoricalVotingPowerWithRelations[]> {
    return await getHistoricalVotingPowersWithRelations(this.db, {
      skip,
      limit,
      orderDirection,
      orderBy,
      accountId,
      minDelta,
      maxDelta,
      fromDate,
      toDate,
    });
  }

  async getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy:
      | "votingPower"
      | "delegationsCount"
      | "variation"
      | "signedVariation"
      | "total"
      | "balance",
    amountFilter: AmountFilter,
    addresses: Address[],
    fromDate?: number,
    toDate?: number,
  ): Promise<{ items: DBAccountPowerWithVariation[]; totalCount: number }> {
    const allAccountIds = this.allAccountIdsUnion();
    const balanceSubquery = this.balanceSumSubquery();
    const variationSubquery = this.variationSumSubquery(fromDate, toDate);

    // Delegated voting power on its own, i.e. the combined total minus the
    // account's own balance. The amount filter targets this, matching both the
    // `votingPower` ordering below and what consumers render as delegation
    // received: filtering the combined total would let a large self balance
    // alone satisfy a minimum, or push a delegated account past a maximum.
    const delegatedPowerSql = sql<bigint>`COALESCE(${accountPower.votingPower}, 0)`;
    const filter = this.filterToSql(
      addresses,
      amountFilter,
      delegatedPowerSql,
      sql`${allAccountIds.accountId}`,
    );

    // Aave has hundreds of thousands of accounts, so summing balances and
    // voting-power deltas for every account on every request times out the
    // gateway. Pick the page of accounts first, joining a full-table
    // aggregation only when the requested ordering depends on it, and compute
    // the remaining per-account values afterwards for just that page.
    const needsBalanceAggregation =
      orderBy === "total" || orderBy === "balance";
    const needsVariationAggregation =
      orderBy === "variation" || orderBy === "signedVariation";

    const orderKeySql =
      orderBy === "variation"
        ? sql`ABS(COALESCE(${variationSubquery.absoluteChange}, 0))`
        : orderBy === "signedVariation"
          ? sql`COALESCE(${variationSubquery.absoluteChange}, 0)`
          : orderBy === "total"
            ? sql`(COALESCE(${accountPower.votingPower}, 0) + COALESCE(${balanceSubquery.totalBalance}, 0))`
            : orderBy === "votingPower"
              ? delegatedPowerSql
              : orderBy === "balance"
                ? sql`COALESCE(${balanceSubquery.totalBalance}, 0)`
                : sql`COALESCE(${accountPower.delegationsCount}, 0)`;

    const orderDirectionFn = orderDirection === "desc" ? desc : asc;

    let pageQuery = this.db
      .select({ accountId: allAccountIds.accountId })
      .from(allAccountIds)
      .leftJoin(
        accountPower,
        eq(allAccountIds.accountId, accountPower.accountId),
      )
      .$dynamic();
    if (needsBalanceAggregation) {
      pageQuery = pageQuery.leftJoin(
        balanceSubquery,
        eq(allAccountIds.accountId, balanceSubquery.accountId),
      );
    }
    if (needsVariationAggregation) {
      pageQuery = pageQuery.leftJoin(
        variationSubquery,
        eq(allAccountIds.accountId, variationSubquery.accountId),
      );
    }

    const [page, [totalCount]] = await Promise.all([
      pageQuery
        .where(filter)
        .orderBy(orderDirectionFn(orderKeySql), asc(allAccountIds.accountId))
        .offset(skip)
        .limit(limit),
      this.db
        .select({
          count: sql<number>`COUNT(*)`.as("count"),
        })
        .from(allAccountIds)
        .leftJoin(
          accountPower,
          eq(allAccountIds.accountId, accountPower.accountId),
        )
        .where(filter),
    ]);

    const pageAccountIds = page.map((row) => row.accountId);
    const rows = pageAccountIds.length
      ? await this.getVotingPowerRowsByAccountIds(
          pageAccountIds,
          fromDate,
          toDate,
        )
      : [];
    const rowsByAccountId = new Map(rows.map((row) => [row.accountId, row]));

    return {
      items: pageAccountIds.flatMap((accountId) => {
        const row = rowsByAccountId.get(accountId);
        return row ? [row] : [];
      }),
      totalCount: Number(totalCount?.count ?? 0),
    };
  }

  /**
   * Full voting-power rows (combined power, balance, variation) for a known
   * set of accounts. All aggregations are scoped to those accounts, so this
   * stays cheap regardless of table size.
   */
  private async getVotingPowerRowsByAccountIds(
    accountIds: Address[],
    fromDate?: number,
    toDate?: number,
  ): Promise<DBAccountPowerWithVariation[]> {
    const pageAccounts = this.allAccountIdsUnion(accountIds);
    const balanceSubquery = this.balanceSumSubquery(accountIds);
    const variationSubquery = this.variationSumSubquery(
      fromDate,
      toDate,
      accountIds,
    );

    const combinedPowerSql = sql<bigint>`(COALESCE(${accountPower.votingPower}, 0) + COALESCE(${balanceSubquery.totalBalance}, 0))`;
    const absoluteChangeSql = sql<bigint>`COALESCE(${variationSubquery.absoluteChange}, 0)`;
    const percentageChangeSql = sql<string>`
    CASE
      WHEN (${combinedPowerSql} - COALESCE(${variationSubquery.absoluteChange}, 0)) = 0 THEN
        CASE WHEN COALESCE(${variationSubquery.absoluteChange}, 0) = 0 THEN '0'
        ELSE ${PERCENTAGE_NO_BASELINE} END
      ELSE ROUND((COALESCE(${variationSubquery.absoluteChange}, 0)::numeric / (${combinedPowerSql} - COALESCE(${variationSubquery.absoluteChange}, 0))::numeric) * 100, 6)::text
    END
  `;

    const rows = await this.db
      .select({
        accountId: pageAccounts.accountId,
        daoId: accountPower.daoId,
        votingPower: combinedPowerSql,
        votesCount: accountPower.votesCount,
        proposalsCount: accountPower.proposalsCount,
        delegationsCount: accountPower.delegationsCount,
        lastVoteTimestamp: accountPower.lastVoteTimestamp,
        absoluteChange: absoluteChangeSql,
        percentageChange: percentageChangeSql,
        balance: balanceSubquery.totalBalance,
      })
      .from(pageAccounts)
      .leftJoin(
        accountPower,
        eq(pageAccounts.accountId, accountPower.accountId),
      )
      .leftJoin(
        balanceSubquery,
        eq(pageAccounts.accountId, balanceSubquery.accountId),
      )
      .leftJoin(
        variationSubquery,
        eq(pageAccounts.accountId, variationSubquery.accountId),
      );

    return rows.map((row) => ({
      ...row,
      daoId: row.daoId ?? "",
      votesCount: row.votesCount ?? 0,
      proposalsCount: row.proposalsCount ?? 0,
      delegationsCount: row.delegationsCount ?? 0,
      lastVoteTimestamp: row.lastVoteTimestamp ?? 0n,
      balance: row.balance ? BigInt(row.balance) : undefined,
    }));
  }

  private allAccountIdsUnion(accountIds?: Address[]) {
    return this.db
      .selectDistinct({ accountId: accountPower.accountId })
      .from(accountPower)
      .where(
        accountIds ? inArray(accountPower.accountId, accountIds) : undefined,
      )
      .union(
        this.db
          .selectDistinct({ accountId: accountBalance.accountId })
          .from(accountBalance)
          .where(
            accountIds
              ? inArray(accountBalance.accountId, accountIds)
              : undefined,
          ),
      )
      .as("all_accounts");
  }

  private balanceSumSubquery(accountIds?: Address[]) {
    return this.db
      .select({
        accountId: accountBalance.accountId,
        totalBalance: sql<string>`SUM(${accountBalance.balance})`.as(
          "total_balance",
        ),
      })
      .from(accountBalance)
      .where(
        accountIds ? inArray(accountBalance.accountId, accountIds) : undefined,
      )
      .groupBy(accountBalance.accountId)
      .as("balance");
  }

  private variationSumSubquery(
    fromDate?: number,
    toDate?: number,
    accountIds?: Address[],
  ) {
    return this.db
      .select({
        accountId: votingPowerHistory.accountId,
        absoluteChange: sql<bigint>`SUM(${votingPowerHistory.delta})`.as(
          "absolute_change",
        ),
      })
      .from(votingPowerHistory)
      .where(
        and(
          accountIds
            ? inArray(votingPowerHistory.accountId, accountIds)
            : undefined,
          fromDate
            ? gte(votingPowerHistory.timestamp, BigInt(fromDate))
            : undefined,
          toDate
            ? lte(votingPowerHistory.timestamp, BigInt(toDate))
            : undefined,
        ),
      )
      .groupBy(votingPowerHistory.accountId)
      .as("variation");
  }

  async getVotingPowersByAccountId(
    accountId: Address,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBAccountPowerWithVariation> {
    const balanceSubquery = this.db
      .select({
        accountId: accountBalance.accountId,
        totalBalance: sql<string>`SUM(${accountBalance.balance})`.as(
          "total_balance",
        ),
      })
      .from(accountBalance)
      .where(eq(accountBalance.accountId, accountId))
      .groupBy(accountBalance.accountId)
      .as("balance");

    const variationSubquery = this.db
      .select({
        accountId: votingPowerHistory.accountId,
        absoluteChange: sql<bigint>`SUM(${votingPowerHistory.delta})`.as(
          "absolute_change",
        ),
      })
      .from(votingPowerHistory)
      .where(
        and(
          eq(votingPowerHistory.accountId, accountId),
          fromDate
            ? gte(votingPowerHistory.timestamp, BigInt(fromDate))
            : undefined,
          toDate
            ? lte(votingPowerHistory.timestamp, BigInt(toDate))
            : undefined,
        ),
      )
      .groupBy(votingPowerHistory.accountId)
      .as("variation");

    const combinedPowerSql = sql<bigint>`(${accountPower.votingPower} + COALESCE(${balanceSubquery.totalBalance}, 0))`;

    const [result] = await this.db
      .select({
        accountId: accountPower.accountId,
        daoId: accountPower.daoId,
        votingPower: combinedPowerSql,
        votesCount: accountPower.votesCount,
        proposalsCount: accountPower.proposalsCount,
        delegationsCount: accountPower.delegationsCount,
        lastVoteTimestamp: accountPower.lastVoteTimestamp,
        absoluteChange: sql<bigint>`COALESCE(${variationSubquery.absoluteChange}, 0)`,
        percentageChange: sql<string>`
          CASE
            WHEN (${combinedPowerSql} - COALESCE(${variationSubquery.absoluteChange}, 0)) = 0 THEN
              CASE WHEN COALESCE(${variationSubquery.absoluteChange}, 0) = 0 THEN '0'
              ELSE ${PERCENTAGE_NO_BASELINE} END
            ELSE ROUND((COALESCE(${variationSubquery.absoluteChange}, 0)::numeric / (${combinedPowerSql} - COALESCE(${variationSubquery.absoluteChange}, 0))::numeric) * 100, 6)::text
          END
        `,
        balance: balanceSubquery.totalBalance,
      })
      .from(accountPower)
      .leftJoin(
        balanceSubquery,
        eq(accountPower.accountId, balanceSubquery.accountId),
      )
      .leftJoin(
        variationSubquery,
        eq(accountPower.accountId, variationSubquery.accountId),
      )
      .where(eq(accountPower.accountId, accountId));

    return result
      ? {
          ...result,
          balance: result.balance ? BigInt(result.balance) : undefined,
          absoluteChange: result.absoluteChange,
          percentageChange: result.percentageChange,
        }
      : {
          accountId: accountId,
          votingPower: 0n,
          delegationsCount: 0,
          votesCount: 0,
          proposalsCount: 0,
          daoId: "",
          lastVoteTimestamp: 0n,
          absoluteChange: 0n,
          percentageChange: "0",
        };
  }
  private filterToSql(
    addresses: Address[],
    amountFilter: AmountFilter,
    votingPowerSql?: SQL,
    accountIdSql?: SQL,
  ): SQL | undefined {
    const conditions = [];

    if (addresses.length) {
      conditions.push(
        inArray(accountIdSql ?? sql`${accountPower.accountId}`, addresses),
      );
    }
    if (votingPowerSql) {
      if (amountFilter.minAmount) {
        conditions.push(
          sql`${votingPowerSql} > ${BigInt(amountFilter.minAmount)}`,
        );
      }
      if (amountFilter.maxAmount) {
        conditions.push(
          sql`${votingPowerSql} < ${BigInt(amountFilter.maxAmount)}`,
        );
      }
    } else {
      if (amountFilter.minAmount) {
        conditions.push(
          gt(accountPower.votingPower, BigInt(amountFilter.minAmount)),
        );
      }
      if (amountFilter.maxAmount) {
        conditions.push(
          lt(accountPower.votingPower, BigInt(amountFilter.maxAmount)),
        );
      }
    }

    return conditions.length ? and(...conditions) : sql`true`;
  }
}
