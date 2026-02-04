import { Address } from "viem";

import {
  DBHistoricalVotingPowerWithRelations,
  DBVotingPowerVariation,
  AmountFilter,
  DBAccountPower,
} from "@/mappers";

interface HistoricalVotingPowerRepository {
  getHistoricalVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    accountId?: Address,
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBHistoricalVotingPowerWithRelations[]>;

  getHistoricalVotingPowerCount(
    accountId?: Address,
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<number>;
}

interface VotingPowersRepository {
  getVotingPowerVariations(
    startTimestamp: number | undefined,
    endTimestamp: number | undefined,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBVotingPowerVariation[]>;

  getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number | undefined,
    endTimestamp: number | undefined,
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
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc" = "desc",
    orderBy: "timestamp" | "delta" = "timestamp",
    accountId?: Address,
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
        skip,
        limit,
        orderDirection,
        orderBy,
        accountId,
        minDelta,
        maxDelta,
        fromDate,
        toDate,
      );

    const totalCount =
      await this.historicalVotingRepository.getHistoricalVotingPowerCount(
        accountId,
        minDelta,
        maxDelta,
        fromDate,
        toDate,
      );
    return { items, totalCount };
  }

  async getVotingPowerVariations(
    startTimestamp: number | undefined,
    endTimestamp: number | undefined,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
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

    if (!addresses) return variations;

    return addresses.map((address) => {
      const dbVariation = variations.find(
        (variation) => variation.accountId === address,
      );

      if (dbVariation) return dbVariation;

      return {
        accountId: address,
        previousVotingPower: 0n,
        currentVotingPower: 0n,
        absoluteChange: 0n,
        percentageChange: "0",
      };
    });
  }

  async getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number | undefined,
    endTimestamp: number | undefined,
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
