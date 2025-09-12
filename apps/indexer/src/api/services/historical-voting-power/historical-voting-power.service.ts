import { Address } from "viem";

import { DaysEnum } from "@/lib/enums";

export interface HistoricalVotingPower {
  address: Address;
  votingPower: bigint;
}

interface VotingPowerRepository {
  getHistoricalVotingPower(
    addresses: Address[],
    timestamp: bigint,
  ): Promise<HistoricalVotingPower[]>;
}

export class HistoricalVotingPowerService {
  constructor(private readonly repository: VotingPowerRepository) {}

  async getHistoricalVotingPower(
    addresses: Address[],
    daysInSeconds: DaysEnum,
  ): Promise<HistoricalVotingPower[]> {
    return await this.repository.getHistoricalVotingPower(
      addresses,
      BigInt(Math.floor(Date.now() / 1000) - daysInSeconds),
    );
  }
}
