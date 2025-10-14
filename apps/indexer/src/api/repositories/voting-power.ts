import { Address } from "viem";
import {
  gte,
  and,
  inArray,
  lte,
  desc,
  eq,
  asc,
  sql,
  isNotNull,
} from "drizzle-orm";
import { db } from "ponder:api";
import { votingPowerHistory, delegation, transfer } from "ponder:schema";

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

  async getTopVotingPowerChanges(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]> {
    const deltas = db
      .select()
      .from(votingPowerHistory)
      .orderBy(desc(votingPowerHistory.timestamp))
      .where(lte(votingPowerHistory.timestamp, BigInt(startTimestamp)))
      .as("deltas");

    const aggregated = db
      .select({
        accountId: deltas.accountId,
        absoluteChange: sql<string>`SUM(${deltas.delta})`.as("agg_delta"),
        currentVotingPower: sql<string>`MAX(${deltas.votingPower})`.as(
          "current_voting_power",
        ),
      })
      .from(deltas)
      .where(isNotNull(deltas.accountId))
      .groupBy(deltas.accountId)
      .as("aggregated");

    const result = await db
      .select()
      .from(aggregated)
      .orderBy(
        orderDirection === "desc"
          ? desc(sql`ABS(${aggregated.absoluteChange})`)
          : asc(sql`ABS(${aggregated.absoluteChange})`),
      )
      .limit(limit)
      .offset(skip);

    return result.map(({ accountId, currentVotingPower, absoluteChange }) => {
      const numericCurrentVotingPower = BigInt(currentVotingPower);
      const numericAbsoluteChange = BigInt(absoluteChange);
      const oldVotingPower = numericCurrentVotingPower - numericAbsoluteChange;
      const percentageChange = oldVotingPower
        ? Number((numericAbsoluteChange * 10000n) / oldVotingPower) / 100
        : 100;

      return {
        accountId: accountId,
        previousVotingPower: numericCurrentVotingPower - numericAbsoluteChange,
        currentVotingPower: numericCurrentVotingPower,
        absoluteChange: numericAbsoluteChange,
        percentageChange: percentageChange,
      };
    });
  }
}
