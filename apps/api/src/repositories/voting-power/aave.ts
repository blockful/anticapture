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
  delegation,
  transfer,
  accountPower,
  accountBalance,
} from "@/database";
import {
  AmountFilter,
  DBAccountPowerWithVariation,
  DBHistoricalVotingPowerWithRelations,
} from "@/mappers";
import { PERCENTAGE_NO_BASELINE } from "@/mappers/constants";

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
    const result = await this.db
      .select()
      .from(votingPowerHistory)
      .leftJoin(
        delegation,
        sql`${votingPowerHistory.transactionHash} = ${delegation.transactionHash}
          AND ${delegation.logIndex} = (
            SELECT MAX(${delegation.logIndex})
            FROM ${delegation}
            WHERE ${delegation.transactionHash} = ${votingPowerHistory.transactionHash}
            AND ${delegation.logIndex} < ${votingPowerHistory.logIndex}
        )`,
      )
      .leftJoin(
        transfer,
        sql`${votingPowerHistory.transactionHash} = ${transfer.transactionHash}
          AND ${transfer.logIndex} = (
            SELECT MAX(${transfer.logIndex})
            FROM ${transfer}
            WHERE ${transfer.transactionHash} = ${votingPowerHistory.transactionHash}
            AND ${transfer.logIndex} < ${votingPowerHistory.logIndex}
        )`,
      )
      .where(
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
          toDate
            ? lte(votingPowerHistory.timestamp, BigInt(toDate))
            : undefined,
        ),
      )
      .orderBy(
        orderDirection === "asc"
          ? asc(
              orderBy === "timestamp"
                ? votingPowerHistory.timestamp
                : votingPowerHistory.deltaMod,
            )
          : desc(
              orderBy === "timestamp"
                ? votingPowerHistory.timestamp
                : votingPowerHistory.deltaMod,
            ),
      )
      .limit(limit)
      .offset(skip);

    return result.map((row) => ({
      ...row.voting_power_history,
      delegations:
        row.transfers &&
        row.transfers?.logIndex > (row.delegations?.logIndex || 0)
          ? null
          : row.delegations,
      transfers:
        row.delegations &&
        row.delegations?.logIndex > (row.transfers?.logIndex || 0)
          ? null
          : row.transfers,
    }));
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
    const balanceSubquery = this.db
      .select({
        accountId: accountBalance.accountId,
        totalBalance: sql<bigint>`SUM(${accountBalance.balance})`.as(
          "total_balance",
        ),
      })
      .from(accountBalance)
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
    const absoluteChangeSql = sql<bigint>`COALESCE(${variationSubquery.absoluteChange}, 0)`;
    const percentageChangeSql = sql<string>`
    CASE
      WHEN (${combinedPowerSql} - COALESCE(${variationSubquery.absoluteChange}, 0)) = 0 THEN
        CASE WHEN COALESCE(${variationSubquery.absoluteChange}, 0) = 0 THEN '0'
        ELSE ${PERCENTAGE_NO_BASELINE} END
      ELSE ROUND((COALESCE(${variationSubquery.absoluteChange}, 0)::numeric / (${combinedPowerSql} - COALESCE(${variationSubquery.absoluteChange}, 0))::numeric) * 100, 6)::text
    END
  `;

    const orderDirectionFn = orderDirection === "desc" ? desc : asc;
    const orderSql = orderDirectionFn(
      orderBy === "variation"
        ? sql`ABS(COALESCE(${variationSubquery.absoluteChange}, 0))`
        : orderBy === "signedVariation"
          ? orderDirectionFn(
              sql`COALESCE(${variationSubquery.absoluteChange}, 0)`,
            )
          : orderBy === "total"
            ? combinedPowerSql
            : orderBy === "votingPower"
              ? accountPower.votingPower
              : orderBy === "balance"
                ? sql`COALESCE(${balanceSubquery.totalBalance}, 0)`
                : accountPower.delegationsCount,
    );

    const items = await this.db
      .select({
        accountId: accountPower.accountId,
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
      .from(accountPower)
      .leftJoin(
        balanceSubquery,
        eq(accountPower.accountId, balanceSubquery.accountId),
      )
      .leftJoin(
        variationSubquery,
        eq(accountPower.accountId, variationSubquery.accountId),
      )
      .where(this.filterToSql(addresses, amountFilter, combinedPowerSql))
      .orderBy(orderSql)
      .offset(skip)
      .limit(limit);

    const [totalCount] = await this.db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(accountPower)
      .leftJoin(
        balanceSubquery,
        eq(accountPower.accountId, balanceSubquery.accountId),
      )
      .where(this.filterToSql(addresses, amountFilter, combinedPowerSql));

    return {
      items: items.map((row) => ({
        ...row,
        votingPower: BigInt(row.votingPower ?? 0),
        absoluteChange: BigInt(row.absoluteChange ?? 0),
        percentageChange: String(row.percentageChange ?? "0"),
      })),
      totalCount: Number(totalCount?.count ?? 0),
    };
  }

  async getVotingPowersByAccountId(
    accountId: Address,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBAccountPowerWithVariation> {
    const balanceSubquery = this.db
      .select({
        accountId: accountBalance.accountId,
        totalBalance: sql<bigint>`SUM(${accountBalance.balance})`.as(
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
          votingPower: BigInt(result.votingPower ?? 0),
          absoluteChange: BigInt(result.absoluteChange ?? 0),
          percentageChange: String(result.percentageChange ?? "0"),
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
    totalVotingPowerSql?: SQL,
  ): SQL | undefined {
    const conditions = [];

    if (addresses.length) {
      conditions.push(inArray(accountPower.accountId, addresses));
    }
    if (totalVotingPowerSql) {
      if (amountFilter.minAmount) {
        conditions.push(
          sql`${totalVotingPowerSql} > ${BigInt(amountFilter.minAmount)}`,
        );
      }
      if (amountFilter.maxAmount) {
        conditions.push(
          sql`${totalVotingPowerSql} < ${BigInt(amountFilter.maxAmount)}`,
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
