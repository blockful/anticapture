import { Address } from "viem";
import { and, inArray, lte, desc, eq, asc, lt } from "drizzle-orm";
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
  ): Promise<DBVotingPowerWithRelations[]> {
    const result = await db
      .select()
      .from(votingPowerHistory)
      .where(eq(votingPowerHistory.accountId, accountId))
      .leftJoin(
        delegation,
        and(
          eq(votingPowerHistory.transactionHash, delegation.transactionHash),
          lt(delegation.logIndex, votingPowerHistory.logIndex),
        ),
      )
      .leftJoin(
        transfer,
        and(
          eq(votingPowerHistory.transactionHash, transfer.transactionHash),
          lt(transfer.logIndex, votingPowerHistory.logIndex),
        ),
      )
      .orderBy(
        orderDirection === "asc"
          ? asc(votingPowerHistory.timestamp)
          : desc(votingPowerHistory.timestamp),
      )
      .limit(limit)
      .offset(skip);

    return result.map((row) => ({
      ...row.voting_power_history,
      delegations: row.delegations,
      transfers: row.transfers,
    }));
  }
}
