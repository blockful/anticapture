import { Address } from "viem";

import {
  DBHistoricalVotingPowerWithRelations,
  DBVotingPowerVariation,
  AmountFilter,
  DBAccountPower,
} from "@/api/mappers";

interface HistoricalVotingPowerRepository {
  getHistoricalVotingPowers(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    minDelta?: string,
    maxDelta?: string,
  ): Promise<DBHistoricalVotingPowerWithRelations[]>;

  getHistoricalVotingPowerCount(
    account: Address,
    minDelta?: string,
    maxDelta?: string,
  ): Promise<number>;
}

interface VotingPowersRepository {
  getVotingPowerVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]>;

  getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number,
  ): Promise<DBVotingPowerVariation>;

  getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    amountFilter: AmountFilter,
    addresses: Address[],
  ): Promise<{ items: DBAccountPower[]; totalCount: number }>;

  getVotingPowersByAccountId(accountId: Address): Promise<DBAccountPower>;
}

export class VotingPowerService {
  constructor(
    private readonly historicalVotingRepository: HistoricalVotingPowerRepository,
    private readonly votingPowerRepository: VotingPowersRepository,
  ) {}

  async getHistoricalVotingPowers(
    account: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc" = "desc",
    orderBy: "timestamp" | "delta" = "timestamp",
    minDelta?: string,
    maxDelta?: string,
  ): Promise<{
    items: DBHistoricalVotingPowerWithRelations[];
    totalCount: number;
  }> {
    const items =
      await this.historicalVotingRepository.getHistoricalVotingPowers(
        account,
        skip,
        limit,
        orderDirection,
        orderBy,
        minDelta,
        maxDelta,
      );

    const totalCount =
      await this.historicalVotingRepository.getHistoricalVotingPowerCount(
        account,
        minDelta,
        maxDelta,
      );
    return { items, totalCount };
  }

  async getVotingPowerVariations(
    startTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]> {
    return this.votingPowerRepository.getVotingPowerVariations(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }

  async getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number,
  ): Promise<DBVotingPowerVariation> {
    return this.votingPowerRepository.getVotingPowerVariationsByAccountId(
      accountId,
      startTimestamp,
    );
  }

  async getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    amountFilter: AmountFilter,
    addresses: Address[],
  ): Promise<{ items: DBAccountPower[]; totalCount: number }> {
    return this.votingPowerRepository.getVotingPowers(
      limit,
      skip,
      orderDirection,
      amountFilter,
      addresses,
    );
  }

  async getVotingPowersByAccountId(
    accountId: Address,
  ): Promise<DBAccountPower> {
    return this.votingPowerRepository.getVotingPowersByAccountId(accountId);
  }
}
