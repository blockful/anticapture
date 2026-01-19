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
    fromDate?: number,
    toDate?: number,
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
    endTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBVotingPowerVariation[]>;

  getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<DBVotingPowerVariation>;

  getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "votingPower" | "delegationsCount",
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
    fromDate?: number,
    toDate?: number,
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
        fromDate,
        toDate,
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
    addresses: Address[],
    startTimestamp: number,
    endTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]> {
    const variations =
      await this.votingPowerRepository.getVotingPowerVariations(
        startTimestamp,
        endTimestamp,
        skip,
        limit,
        orderDirection,
        addresses,
      );

    return addresses.map((address) => {
      const dbVariation = variations.find(
        (variation) => variation.accountId === address,
      );

      if (dbVariation) return dbVariation;

      // handling addresses that have no delegations
      return {
        accountId: address,
        previousVotingPower: 0n,
        currentVotingPower: 0n,
        absoluteChange: 0n,
        percentageChange: "0",
      };
    });
  }

  async getTopVotingPowerVariations(
    startTimestamp: number,
    endTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBVotingPowerVariation[]> {
    return this.votingPowerRepository.getVotingPowerVariations(
      startTimestamp,
      endTimestamp,
      skip,
      limit,
      orderDirection,
    );
  }

  async getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<DBVotingPowerVariation> {
    return this.votingPowerRepository.getVotingPowerVariationsByAccountId(
      accountId,
      startTimestamp,
      endTimestamp,
    );
  }

  async getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "votingPower" | "delegationsCount",
    amountFilter: AmountFilter,
    addresses: Address[],
  ): Promise<{ items: DBAccountPower[]; totalCount: number }> {
    return this.votingPowerRepository.getVotingPowers(
      skip,
      limit,
      orderDirection,
      orderBy,
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
