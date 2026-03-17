import { Address } from "viem";

import {
  DBHistoricalVotingPowerWithRelations,
  AmountFilter,
  DBAccountPowerWithVariation,
} from "@/mappers";

interface Repo {
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

  getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy:
      | "votingPower"
      | "delegationsCount"
      | "variation"
      | "signedVariation"
      | "total"
      | "balance",
    amountFilter: AmountFilter,
    addresses: Address[],
    fromDate?: number,
    toDate?: number,
  ): Promise<{ items: DBAccountPowerWithVariation[]; totalCount: number }>;

  getVotingPowersByAccountId(
    accountId: Address,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBAccountPowerWithVariation>;
}

export class AAVEVotingPowerService {
  constructor(private readonly repo: Repo) {}

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
    const items = await this.repo.getHistoricalVotingPowers(
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

    const totalCount = await this.repo.getHistoricalVotingPowerCount(
      accountId,
      minDelta,
      maxDelta,
      fromDate,
      toDate,
    );
    return { items, totalCount };
  }

  async getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy:
      | "votingPower"
      | "delegationsCount"
      | "variation"
      | "signedVariation"
      | "total"
      | "balance",
    amountFilter: AmountFilter,
    addresses: Address[],
    fromDate?: number,
    toDate?: number,
  ): Promise<{ items: DBAccountPowerWithVariation[]; totalCount: number }> {
    return this.repo.getVotingPowers(
      skip,
      limit,
      orderDirection,
      orderBy,
      amountFilter,
      addresses,
      fromDate,
      toDate,
    );
  }

  async getVotingPowersByAccountId(
    accountId: Address,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBAccountPowerWithVariation> {
    return this.repo.getVotingPowersByAccountId(accountId, fromDate, toDate);
  }
}
