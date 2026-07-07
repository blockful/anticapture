import { gte, and, lte, eq } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle, votingPowerHistory } from "@/database";
import { DBHistoricalVotingPowerWithRelations } from "@/mappers";

import { getHistoricalVotingPowersWithRelations } from "./historical-query";

export class NounsVotingPowerRepository {
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
      transferRelation: "next",
    });
  }
}
