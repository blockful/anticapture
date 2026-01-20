import {
  DBAccountBalanceVariation,
  AccountInteractions,
  Filter,
} from "@/api/mappers";
import { Address } from "viem";

interface AccountBalanceRepository {
  getAccountBalanceVariations(
    fromTimestamp: number,
    toTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]>;

  getAccountBalanceVariationsByAccountId(
    address: Address,
    fromTimestamp: number,
    toTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]>;
}

interface AccountInteractionsRepository {
  getAccountInteractions(
    accountId: Address,
    fromTimestamp: number,
    toTimestamp: number,
    limit: number,
    skip: number,
    orderBy: "volume" | "count",
    orderDirection: "asc" | "desc",
    filter: Filter,
  ): Promise<AccountInteractions>;
}

export class BalanceVariationsService {
  constructor(
    private readonly balanceRepository: AccountBalanceRepository,
    private readonly interactionRepository: AccountInteractionsRepository,
  ) { }

  async getAccountBalanceVariations(
    fromTimestamp: number,
    toTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    return this.balanceRepository.getAccountBalanceVariations(
      fromTimestamp,
      toTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }

  async getAccountBalanceVariationsByAccountId(
    address: Address,
    fromTimestamp: number,
    toTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    return this.balanceRepository.getAccountBalanceVariationsByAccountId(
      address,
      fromTimestamp,
      toTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }

  async getAccountInteractions(
    accountId: Address,
    fromTimestamp: number,
    toTimestamp: number,
    skip: number,
    limit: number,
    orderBy: "volume" | "count",
    orderDirection: "asc" | "desc",
    filter: Filter,
  ): Promise<AccountInteractions> {
    return this.interactionRepository.getAccountInteractions(
      accountId,
      fromTimestamp,
      toTimestamp,
      limit,
      skip,
      orderBy,
      orderDirection,
      filter,
    );
  }
}
