import { Address } from "viem";

import { DBVotingPowerWithRelations } from "@/api/mappers";

interface VotingPowerRepository {
  getVotingPowers(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
  ): Promise<DBVotingPowerWithRelations[]>;

  getVotingPowerCount(account: Address): Promise<number>;
}

export class VotingPowerService {
  constructor(private readonly repository: VotingPowerRepository) {}

  async getVotingPowers(
    account: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc" = "desc",
    orderBy: "timestamp" | "delta" = "timestamp",
  ): Promise<{ items: DBVotingPowerWithRelations[]; totalCount: number }> {
    const items = await this.repository.getVotingPowers(
      account,
      skip,
      limit,
      orderDirection,
      orderBy,
    );

    const totalCount = await this.repository.getVotingPowerCount(account);
    return { items, totalCount };
  }
}
