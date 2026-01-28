import { Address } from "viem";

import { DBHistoricalBalanceWithRelations } from "@/api/mappers";

interface Repository {
  getHistoricalBalances(
    accountId: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBHistoricalBalanceWithRelations[]>;

  getHistoricalBalanceCount(
    accountId: Address,
    minDelta?: string,
    maxDelta?: string,
  ): Promise<number>;
}

export class HistoricalBalancesService {
  constructor(private readonly repository: Repository) {}

  async getHistoricalBalances(
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
    items: DBHistoricalBalanceWithRelations[];
    totalCount: number;
  }> {
    const items = await this.repository.getHistoricalBalances(
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

    const totalCount = await this.repository.getHistoricalBalanceCount(
      account,
      minDelta,
      maxDelta,
    );
    return { items, totalCount };
  }
}
