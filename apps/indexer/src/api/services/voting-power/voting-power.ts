import { Address } from "viem";

import {
  DBVotingPowerWithRelations,
  DBVotingPowerVariation,
} from "@/api/mappers";

interface VotingPowerRepository {
  getVotingPowers(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    minDelta?: string,
    maxDelta?: string,
    involvedAddresses?: Address[],
  ): Promise<DBVotingPowerWithRelations[]>;

  getVotingPowerCount(
    account: Address,
    minDelta?: string,
    maxDelta?: string,
    involvedAddresses?: Address[],
  ): Promise<number>;
}

interface VotingPowerVariationRepository {
  getVotingPowerChanges(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]>;
}

export class VotingPowerService {
  constructor(
    private readonly votingRepository: VotingPowerRepository,
    private readonly votingPowerVariationRepository: VotingPowerVariationRepository,
  ) {}

  async getVotingPowers(
    account: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc" = "desc",
    orderBy: "timestamp" | "delta" = "timestamp",
    minDelta?: string,
    maxDelta?: string,
    involvedAddresses?: Address[],
  ): Promise<{ items: DBVotingPowerWithRelations[]; totalCount: number }> {
    const items = await this.votingRepository.getVotingPowers(
      account,
      skip,
      limit,
      orderDirection,
      orderBy,
      minDelta,
      maxDelta,
      involvedAddresses,
    );

    const totalCount = await this.votingRepository.getVotingPowerCount(
      account,
      minDelta,
      maxDelta,
      involvedAddresses,
    );
    return { items, totalCount };
  }

  async getVotingPowerVariations(
    startTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]> {
    return this.votingPowerVariationRepository.getVotingPowerChanges(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }
}
