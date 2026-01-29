import { Address } from "viem";
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
import { Drizzle } from "@/database";
import {
  votingPowerHistory,
  delegation,
  transfer,
  accountPower,
} from "@/database";

import {
  AmountFilter,
  DBAccountPower,
  DBVotingPowerVariation,
  DBHistoricalVotingPowerWithRelations,
} from "@/mappers";
import { PERCENTAGE_NO_BASELINE } from "@/mappers/constants";

export class VotingPowerRepository {
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

  async getVotingPowerVariations(
    startTimestamp: number | undefined,
    endTimestamp: number | undefined,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBVotingPowerVariation[]> {
    const orderDirectionFn = orderDirection === "asc" ? asc : desc;

    const latestBeforeFrom = this.db
      .select({
        accountId: votingPowerHistory.accountId,
        votingPower: votingPowerHistory.votingPower,
        rn: sql<number>`ROW_NUMBER() OVER (
        PARTITION BY ${votingPowerHistory.accountId} 
        ORDER BY ${votingPowerHistory.timestamp} DESC, ${votingPowerHistory.logIndex} DESC
      )`.as("rn"),
      })
      .from(votingPowerHistory)
      .where(
        and(
          addresses
            ? inArray(votingPowerHistory.accountId, addresses)
            : undefined,
          startTimestamp
            ? lte(votingPowerHistory.timestamp, BigInt(startTimestamp))
            : undefined,
        ),
      )
      .as("latest_before_from");

    const latestBeforeTo = this.db
      .select({
        accountId: votingPowerHistory.accountId,
        votingPower: votingPowerHistory.votingPower,
        rn: sql<number>`ROW_NUMBER() OVER (
        PARTITION BY ${votingPowerHistory.accountId} 
        ORDER BY ${votingPowerHistory.timestamp} DESC, ${votingPowerHistory.logIndex} DESC
      )`.as("rn"),
      })
      .from(votingPowerHistory)
      .where(
        and(
          addresses
            ? inArray(votingPowerHistory.accountId, addresses)
            : undefined,
          endTimestamp
            ? lte(votingPowerHistory.timestamp, BigInt(endTimestamp))
            : undefined,
        ),
      )
      .as("latest_before_to");

    return await this.db
      .select({
        accountId: sql<Address>`COALESCE(from_data.account_id, to_data.account_id)`,
        previousVotingPower: sql<bigint>`COALESCE(from_data.voting_power, 0)`,
        currentVotingPower: sql<bigint>`COALESCE(to_data.voting_power, 0)`,
        absoluteChange: sql<bigint>`(COALESCE(to_data.voting_power, 0) - COALESCE(from_data.voting_power, 0))`,
        percentageChange: sql<string>`
        CASE 
          WHEN COALESCE(from_data.voting_power, 0) = 0 THEN 
            CASE WHEN COALESCE(to_data.voting_power, 0) = 0 THEN '0' ELSE ${PERCENTAGE_NO_BASELINE} END
          ELSE 
            (((COALESCE(to_data.voting_power, 0) - from_data.voting_power)::numeric / from_data.voting_power::numeric) * 100)::text
        END
      `,
      })
      .from(sql`(SELECT * FROM ${latestBeforeFrom} WHERE rn = 1) as from_data`)
      .fullJoin(
        sql`(SELECT * FROM ${latestBeforeTo} WHERE rn = 1) as to_data`,
        sql`from_data.account_id = to_data.account_id`,
      )
      .orderBy(
        orderDirectionFn(
          sql<bigint>`ABS(COALESCE(to_data.voting_power, 0) - COALESCE(from_data.voting_power, 0))`,
        ),
      )
      .limit(limit)
      .offset(skip);
  }

  async getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number | undefined,
    endTimestamp: number | undefined,
  ): Promise<DBVotingPowerVariation> {
    const history = this.db
      .select({
        accountId: votingPowerHistory.accountId,
        delta: votingPowerHistory.delta,
      })
      .from(votingPowerHistory)
      .orderBy(desc(votingPowerHistory.timestamp))
      .where(
        and(
          eq(votingPowerHistory.accountId, accountId),
          startTimestamp
            ? gte(votingPowerHistory.timestamp, BigInt(startTimestamp))
            : undefined,
          endTimestamp
            ? lte(votingPowerHistory.timestamp, BigInt(endTimestamp))
            : undefined,
        ),
      )
      .as("history");

    const [delta] = await this.db
      .select({
        accountId: history.accountId,
        absoluteChange: sql<bigint>`SUM(${history.delta})`.as("agg_delta"),
      })
      .from(history)
      .groupBy(history.accountId);

    const [currentAccountPower] = await this.db
      .select({ currentVotingPower: accountPower.votingPower })
      .from(accountPower)
      .where(eq(accountPower.accountId, accountId));

    if (!currentAccountPower) throw new Error("Account not found");

    const numericAbsoluteChange = BigInt(delta?.absoluteChange || "0");
    const currentVotingPower = currentAccountPower.currentVotingPower;
    const oldVotingPower = currentVotingPower - numericAbsoluteChange;
    const percentageChange = oldVotingPower
      ? (
          Number((numericAbsoluteChange * 10000n) / oldVotingPower) / 100
        ).toFixed(2)
      : "0";

    return {
      accountId: accountId,
      previousVotingPower: currentVotingPower - numericAbsoluteChange,
      currentVotingPower: currentVotingPower,
      absoluteChange: numericAbsoluteChange,
      percentageChange: percentageChange,
    };
  }

  async getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "votingPower" | "delegationsCount",
    amountFilter: AmountFilter,
    addresses: Address[],
  ): Promise<{ items: DBAccountPower[]; totalCount: number }> {
    const orderColumn =
      orderBy === "votingPower"
        ? accountPower.votingPower
        : accountPower.delegationsCount;

    const items = await this.db
      .select()
      .from(accountPower)
      .where(this.filterToSql(addresses, amountFilter))
      .orderBy(orderDirection === "desc" ? desc(orderColumn) : asc(orderColumn))
      .offset(skip)
      .limit(limit);

    const [totalCount] = await this.db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(accountPower)
      .where(this.filterToSql(addresses, amountFilter));

    return {
      items,
      totalCount: Number(totalCount?.count ?? 0),
    };
  }

  async getVotingPowersByAccountId(
    accountId: Address,
  ): Promise<DBAccountPower> {
    const [result] = await this.db
      .select()
      .from(accountPower)
      .where(eq(accountPower.accountId, accountId));

    return result
      ? {
          accountId: result.accountId,
          votingPower: result.votingPower,
          delegationsCount: result.delegationsCount,
          votesCount: result.votesCount,
          proposalsCount: result.proposalsCount,
          daoId: result.daoId,
          lastVoteTimestamp: result.lastVoteTimestamp,
        }
      : {
          accountId: accountId,
          votingPower: 0n,
          delegationsCount: 0,
          votesCount: 0,
          proposalsCount: 0,
          daoId: "",
          lastVoteTimestamp: 0n,
        };
  }

  private filterToSql(
    addresses: Address[],
    amountfilter: AmountFilter,
  ): SQL | undefined {
    const conditions = [];

    if (addresses.length) {
      conditions.push(inArray(accountPower.accountId, addresses));
    }
    if (amountfilter.minAmount) {
      gt(accountPower.votingPower, BigInt(amountfilter.minAmount));
    }
    if (amountfilter.maxAmount) {
      lt(accountPower.votingPower, BigInt(amountfilter.maxAmount));
    }

    return conditions.length ? and(...conditions) : sql`true`;
  }
}
