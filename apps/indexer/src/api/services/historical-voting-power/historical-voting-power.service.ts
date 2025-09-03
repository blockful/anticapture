import { Address } from "viem";

import { DaysEnum } from "@/lib/enums";

export interface DelegationInfo {
  delegateAccountId: string;
  delegatorAccountId: string;
  delegatedValue: bigint;
  previousDelegate: string | null;
}

export interface TransferInfo {
  fromAccountId: Address;
  toAccountId: Address;
  amount: bigint | null;
  tokenId: string | null;
}

export interface HistoricalVotingPower {
  address: Address;
  votingPower: bigint;
  transactionHash: string;
  timestamp: bigint;
  delta: bigint;
  logIndex: number;
  delegation?: DelegationInfo;
  transfer?: TransferInfo;
}

interface VotingPowerRepository {
  getVotingPower(
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
    return await this.repository.getVotingPower(
      addresses,
      BigInt(Math.floor(Date.now() / 1000) - daysInSeconds),
    );
  }
}
