import {
  DBAccountBalanceVariation,
  AccountInteractions,
  Filter,
} from "@/mappers";
import { Address } from "viem";

interface AccountBalanceRepository {
  getAccountBalanceVariations(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]>;

  getAccountBalanceVariationsByAccountId(
    address: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
  ): Promise<DBAccountBalanceVariation>;
}

interface AccountInteractionsRepository {
  getAccountInteractions(
    accountId: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
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
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    const variations = await this.balanceRepository.getAccountBalanceVariations(
      fromTimestamp,
      toTimestamp,
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
        previousBalance: 0n,
        currentBalance: 0n,
        absoluteChange: 0n,
        percentageChange: "0",
      };
    });
  }

  async getAccountBalanceVariationsByAccountId(
    address: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
  ): Promise<DBAccountBalanceVariation> {
    return this.balanceRepository.getAccountBalanceVariationsByAccountId(
      address,
      fromTimestamp,
      toTimestamp,
    );
  }

  async getAccountInteractions(
    accountId: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
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
