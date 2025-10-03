import { Address } from "viem";

import { DBVotingPowerWithRelations } from "@/api/mappers";

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
}

export class VotingPowerService {
  constructor(private readonly repository: VotingPowerRepository) {}

  async getVotingPowers(
    account: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc" = "desc",
    orderBy: "timestamp" | "delta" = "timestamp",
    minDelta?: string,
    maxDelta?: string,
  ): Promise<{ items: DBVotingPowerWithRelations[]; totalCount: number }> {
    const items = await this.repository.getVotingPowers(
      account,
      skip,
      limit,
      orderDirection,
      orderBy,
      minDelta,
      maxDelta,
    );

    const totalCount = await this.repository.getVotingPowerCount(
      account,
      minDelta,
      maxDelta,
    );
    return { items, totalCount };
  }
}
