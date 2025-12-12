import {
  DBAccountBalanceVariation,
  AccountInteractions,
  Filter,
} from "@/api/mappers";
import { Address } from "viem";

interface AccountBalanceRepository {
  getAccountBalanceVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]>;
}

interface AccountInteractionsRepository {
  getAccountInteractions(
    accountId: Address,
    startTimestamp: number,
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
  ) {}

  async getAccountBalanceVariations(
    startTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    return this.balanceRepository.getAccountBalanceVariations(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }

  async getAccountInteractions(
    accountId: Address,
    startTimestamp: number,
    skip: number,
    limit: number,
    orderBy: "volume" | "count",
    orderDirection: "asc" | "desc",
    filter: Filter,
  ): Promise<AccountInteractions> {
    return this.interactionRepository.getAccountInteractions(
      accountId,
      startTimestamp,
      limit,
      skip,
      orderBy,
      orderDirection,
      filter,
    );
  }
}
