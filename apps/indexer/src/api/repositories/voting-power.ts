import { Address } from "viem";
import { and, inArray, lte, desc, eq, asc, sql } from "drizzle-orm";
import { db } from "ponder:api";
import { votingPowerHistory, delegation, transfer } from "ponder:schema";

import { DBVotingPowerWithRelations } from "@/api/mappers";

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

  async getVotingPowerCount(accountId: Address): Promise<number> {
    return await db.$count(
      votingPowerHistory,
      eq(votingPowerHistory.accountId, accountId),
    );
  }

  async getVotingPowers(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
  ): Promise<DBVotingPowerWithRelations[]> {
    const result = await db
      .select()
      .from(votingPowerHistory)
      .where(eq(votingPowerHistory.accountId, accountId))
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
                : votingPowerHistory.delta,
            )
          : desc(
              orderBy === "timestamp"
                ? votingPowerHistory.timestamp
                : votingPowerHistory.delta,
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
}
