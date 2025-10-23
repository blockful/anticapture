import { Address } from "viem";

import { DBVotingPowerWithRelations } from "@/api/mappers";
import { DBVotingPowerVariation } from "../mappers/top-voting-power-variations";

interface VotingPowerRepository {
  getVotingPowers(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    minDelta?: string,
    maxDelta?: string,
  ): Promise<DBVotingPowerWithRelations[]>;

  getVotingPowerCount(
    account: Address,
    minDelta?: string,
    maxDelta?: string,
  ): Promise<number>;

  getTopVotingPowerChanges(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]>;
}

export class VotingPowerService {
  constructor(private readonly votingRepository: VotingPowerRepository) {}

  async getVotingPowers(
    account: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc" = "desc",
    orderBy: "timestamp" | "delta" = "timestamp",
    minDelta?: string,
    maxDelta?: string,
  ): Promise<{ items: DBVotingPowerWithRelations[]; totalCount: number }> {
    const items = await this.votingRepository.getVotingPowers(
      account,
      skip,
      limit,
      orderDirection,
      orderBy,
      minDelta,
      maxDelta,
    );

    const totalCount = await this.votingRepository.getVotingPowerCount(
      account,
      minDelta,
      maxDelta,
    );
    return { items, totalCount };
  }

  async getTopVotingPowerVariations(
    startTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]> {
    return this.votingRepository.getTopVotingPowerChanges(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }
}
