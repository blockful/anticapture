import { Address } from "viem";

import {
  DBAccountBalanceVariation,
  AccountInteractions,
  Filter,
  DBAccountBalance,
  AmountFilter,
  DBAccountBalanceWithVariation,
} from "@/mappers";

interface AccountBalanceRepository {
  getAccountBalance(accountId: Address): Promise<DBAccountBalance | undefined>;

  getAccountBalances(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalance[];
    totalCount: bigint;
  }>;

  getAccountBalancesWithVariation(
    variationFromTimestamp: number,
    variationToTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "balance" | "variation",
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalanceWithVariation[];
    totalCount: bigint;
  }>;
}

interface BalanceVariationsRepository {
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
  ): Promise<DBAccountBalanceVariation | undefined>;
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
    private readonly variationsRepository: BalanceVariationsRepository,
    private readonly interactionRepository: AccountInteractionsRepository,
    private readonly balanceRepository: AccountBalanceRepository,
  ) {}

  async getAccountBalanceVariations(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    const variations =
      await this.variationsRepository.getAccountBalanceVariations(
        fromTimestamp,
        toTimestamp,
        skip,
        limit,
        orderDirection,
        addresses,
      );

    if (!addresses) return variations;

    const found = new Set(variations.map((v) => v.accountId));
    const missingResults = addresses.filter((addr) => !found.has(addr));
    const { items: balances } = await this.balanceRepository.getAccountBalances(
      0,
      missingResults.length,
      "desc",
      missingResults,
      [],
      [],
      { maxAmount: undefined, minAmount: undefined },
    );

    return addresses.map((address) => {
      const dbVariation = variations.find(
        (variation) => variation.accountId === address,
      );

      if (dbVariation) return dbVariation;

      const balance = balances.find((balance) => balance.accountId === address);

      return {
        accountId: address,
        previousBalance: balance?.balance ?? 0n,
        currentBalance: balance?.balance ?? 0n,
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
    const variation =
      await this.variationsRepository.getAccountBalanceVariationsByAccountId(
        address,
        fromTimestamp,
        toTimestamp,
      );

    if (variation) return variation;

    const accountBalance =
      await this.balanceRepository.getAccountBalance(address);
    const balance = accountBalance?.balance ?? 0n;

    return {
      accountId: address,
      previousBalance: balance,
      currentBalance: balance,
      absoluteChange: 0n,
      percentageChange: "0",
    };
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
