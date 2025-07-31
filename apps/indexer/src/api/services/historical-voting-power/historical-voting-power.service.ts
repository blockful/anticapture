import { PublicClient } from "viem";

import {
  VotingPowerHistoriesRequest,
  DBVotingPowerHistoryWithRelations,
  VotingPowerHistoriesResponse,
} from "@/api/mappers";
import { calculateTimeDifference } from "@/lib/blockTime";
import { VotingPowerHistoryMapper } from "@/api/mappers/historical-voting-power";

interface Repository {
  getVotingPowers(args: {
    fromDate: number;
    limit: number;
    skip: number;
    orderBy: "timestamp" | "delta";
    orderDirection: "asc" | "desc";
    addresses?: string[];
  }): Promise<DBVotingPowerHistoryWithRelations[]>;
}

export class HistoricalVotingPowerService {
  constructor(
    private readonly repo: Repository,
    private readonly client: PublicClient,
  ) {}

  async getHistoricalVotingPower({
    addresses,
    days,
    limit,
    skip,
    orderBy,
    orderDirection,
  }: VotingPowerHistoriesRequest): Promise<VotingPowerHistoriesResponse> {
    const timestamp = calculateTimeDifference(days);
    const votingPowers = await this.repo.getVotingPowers({
      fromDate: timestamp,
      limit,
      skip,
      orderBy,
      orderDirection,
      addresses,
    });

    return {
      items: votingPowers.map(VotingPowerHistoryMapper.toApi),
    };
  }

  /**
   * Get current block number
   * @returns The current block number
   */
  async getCurrentBlockNumber(): Promise<number> {
    const blockNumber = await this.client.getBlockNumber();
    return Number(blockNumber);
  }
}
