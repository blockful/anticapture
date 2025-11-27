import { DBAccountBalanceVariation } from "@/api/mappers";
import { Address } from "viem";

interface AccountBalanceRepository {
  getAccountBalanceVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    omitZeroNetVariation: boolean,
  ): Promise<DBAccountBalanceVariation[]>;

  getAccountInteractions(
    accountId: Address,
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    omitZeroNetVariation: boolean,
  ): Promise<DBAccountBalanceVariation[]>;
}

export class BalanceVariationsService {
  constructor(private readonly repository: AccountBalanceRepository) {}

  async getAccountBalanceVariations(
    startTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    omitZeroNetVariation: boolean,
  ): Promise<DBAccountBalanceVariation[]> {
    return this.repository.getAccountBalanceVariations(
      startTimestamp,
      limit,
      skip,
      orderDirection,
      omitZeroNetVariation,
    );
  }

  async getAccountInteractions(
    accountId: Address,
    startTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    omitZeroNetVariation: boolean,
  ): Promise<DBAccountBalanceVariation[]> {
    return this.repository.getAccountInteractions(
      accountId,
      startTimestamp,
      limit,
      skip,
      orderDirection,
      omitZeroNetVariation,
    );
  }
}
