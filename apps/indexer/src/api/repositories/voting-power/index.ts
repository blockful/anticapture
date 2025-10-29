import { Address } from "viem";
import { gte, and, inArray, lte, desc, eq, asc, sql } from "drizzle-orm";
import { db } from "ponder:api";
import {
  votingPowerHistory,
  delegation,
  transfer,
  accountPower,
} from "ponder:schema";

import {
  DBVotingPowerVariation,
  DBVotingPowerWithRelations,
} from "@/api/mappers";

export class VotingPowerRepository {
  async getHistoricalVotingPower(
    addresses: Address[],
    timestamp: bigint,
  ): Promise<{ address: Address; votingPower: bigint }[]> {
    return await db
      .selectDistinctOn([votingPowerHistory.accountId], {
        address: votingPowerHistory.accountId,
        votingPower: votingPowerHistory.votingPower,
      })
      .from(votingPowerHistory)
      .where(
        and(
          inArray(votingPowerHistory.accountId, addresses),
          lte(votingPowerHistory.timestamp, timestamp),
        ),
      )
      .orderBy(
        votingPowerHistory.accountId,
        desc(votingPowerHistory.timestamp),
      );
  }

  async getVotingPowerCount(
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

  async getVotingPowers(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    minDelta?: string,
    maxDelta?: string,
  ): Promise<DBVotingPowerWithRelations[]> {
    const result = await db
      .select()
      .from(votingPowerHistory)
      .where(
        and(
          eq(votingPowerHistory.accountId, accountId),
          minDelta
            ? gte(votingPowerHistory.deltaMod, BigInt(minDelta))
            : undefined,
          maxDelta
            ? lte(votingPowerHistory.deltaMod, BigInt(maxDelta))
            : undefined,
        ),
      )
      .leftJoin(
        delegation,
        sql`${votingPowerHistory.transactionHash} = ${delegation.transactionHash} 
          AND ${delegation.logIndex} = (
            SELECT MAX(d2.log_index) 
            FROM ${delegation} d2 
            WHERE d2.transaction_hash = ${votingPowerHistory.transactionHash} 
            AND d2.log_index < ${votingPowerHistory.logIndex}
        )`,
      )
      .leftJoin(
        transfer,
        sql`${votingPowerHistory.transactionHash} = ${transfer.transactionHash} 
          AND ${transfer.logIndex} = (
            SELECT MAX(t2.log_index) 
            FROM ${transfer} t2 
            WHERE t2.transaction_hash = ${votingPowerHistory.transactionHash} 
            AND t2.log_index < ${votingPowerHistory.logIndex}
        )`,
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

  async getVotingPowerChanges(
    startTimestamp: number,
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
      .where(gte(votingPowerHistory.timestamp, BigInt(startTimestamp)))
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
}
