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
import { db } from "ponder:api";
import {
  votingPowerHistory,
  delegation,
  transfer,
  accountPower,
} from "ponder:schema";

import {
  AmountFilter,
  DBAccountPower,
  DBVotingPowerVariation,
  DBHistoricalVotingPowerWithRelations,
} from "@/api/mappers";

export class VotingPowerRepository {
  async getHistoricalVotingPowerCount(
    accountId: Address,
    minDelta?: string,
    maxDelta?: string,
  ): Promise<number> {
    return await db.$count(
      votingPowerHistory,
      and(
        eq(votingPowerHistory.accountId, accountId),
        minDelta
          ? gte(votingPowerHistory.deltaMod, BigInt(minDelta))
          : undefined,
        maxDelta
          ? lte(votingPowerHistory.deltaMod, BigInt(maxDelta))
          : undefined,
      ),
    );
  }

  async getHistoricalVotingPowers(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBHistoricalVotingPowerWithRelations[]> {
    const result = await db
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
          eq(votingPowerHistory.accountId, accountId),
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
    addresses: Address[],
    startTimestamp: number,
    endTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]> {
    const history = db
      .select({
        delta: votingPowerHistory.delta,
        accountId: votingPowerHistory.accountId,
      })
      .from(votingPowerHistory)
      .orderBy(desc(votingPowerHistory.timestamp))
      .where(
        and(
          gte(votingPowerHistory.timestamp, BigInt(startTimestamp)),
          lte(votingPowerHistory.timestamp, BigInt(endTimestamp)),
          addresses.length
            ? inArray(votingPowerHistory.accountId, addresses)
            : undefined,
        ),
      )
      .as("history");

    const aggregate = db
      .select({
        accountId: history.accountId,
        absoluteChange: sql<bigint>`SUM(${history.delta})`.as("agg_delta"),
        currentVotingPower: accountPower.votingPower,
      })
      .from(history)
      .innerJoin(accountPower, eq(accountPower.accountId, history.accountId))
      .groupBy(history.accountId, accountPower.votingPower)
      .as("aggregate");

    const result = await db
      .select()
      .from(aggregate)
      .orderBy(
        orderDirection === "desc"
          ? desc(sql`ABS(${aggregate.absoluteChange})`)
          : asc(sql`ABS(${aggregate.absoluteChange})`),
      )
      .limit(limit)
      .offset(skip);

    return result.map(({ accountId, currentVotingPower, absoluteChange }) => {
      const numericAbsoluteChange = BigInt(absoluteChange);
      const oldVotingPower = currentVotingPower - numericAbsoluteChange;
      const percentageChange = oldVotingPower
        ? Number((numericAbsoluteChange * 10000n) / oldVotingPower) / 100
        : 0;

      return {
        accountId: accountId,
        previousVotingPower: currentVotingPower - numericAbsoluteChange,
        currentVotingPower: currentVotingPower,
        absoluteChange: numericAbsoluteChange,
        percentageChange: percentageChange,
      };
    });
  }

  async getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<DBVotingPowerVariation> {
    const history = db
      .select({
        accountId: votingPowerHistory.accountId,
        delta: votingPowerHistory.delta,
      })
      .from(votingPowerHistory)
      .orderBy(desc(votingPowerHistory.timestamp))
      .where(
        and(
          eq(votingPowerHistory.accountId, accountId),
          gte(votingPowerHistory.timestamp, BigInt(startTimestamp)),
          lte(votingPowerHistory.timestamp, BigInt(endTimestamp)),
        ),
      )
      .as("history");

    const [delta] = await db
      .select({
        accountId: history.accountId,
        absoluteChange: sql<bigint>`SUM(${history.delta})`.as("agg_delta"),
      })
      .from(history)
      .groupBy(history.accountId);

    const [currentAccountPower] = await db
      .select({ currentVotingPower: accountPower.votingPower })
      .from(accountPower)
      .where(eq(accountPower.accountId, accountId));

    if (!(delta && currentAccountPower)) {
      throw new Error("Account not found");
    }

    const numericAbsoluteChange = BigInt(delta!.absoluteChange);
    const currentVotingPower = currentAccountPower.currentVotingPower;
    const oldVotingPower = currentVotingPower - numericAbsoluteChange;
    const percentageChange = oldVotingPower
      ? Number((numericAbsoluteChange * 10000n) / oldVotingPower) / 100
      : 0;

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
    const result = await db
      .select()
      .from(accountPower)
      .where(this.filterToSql(addresses, amountFilter))
      .orderBy(orderDirection === "desc" ? desc(orderColumn) : asc(orderColumn))
      .offset(skip)
      .limit(limit);

    const [totalCount] = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(accountPower)
      .where(this.filterToSql(addresses, amountFilter));

    return {
      items: result.map((r) => ({
        accountId: r.accountId,
        votingPower: r.votingPower,
        delegationsCount: r.delegationsCount,
        votesCount: r.votesCount,
        proposalsCount: r.proposalsCount,
      })),
      totalCount: Number(totalCount?.count ?? 0),
    };
  }

  async getVotingPowersByAccountId(
    accountId: Address,
  ): Promise<DBAccountPower> {
    const [result] = await db
      .select()
      .from(accountPower)
      .where(eq(accountPower.accountId, accountId));

    if (!result) {
      throw new Error("Account not found");
    }

    return {
      accountId: result.accountId,
      votingPower: result.votingPower,
      delegationsCount: result.delegationsCount,
      votesCount: result.votesCount,
      proposalsCount: result.proposalsCount,
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
