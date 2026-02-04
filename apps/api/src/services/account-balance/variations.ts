import {
  DBAccountBalanceVariation,
  AccountInteractions,
  Filter,
  DBAccountBalance,
} from "@/mappers";
import { Address } from "viem";

interface AccountBalanceRepository {
  getAccountBalance(accountId: Address): Promise<DBAccountBalance | undefined>;
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
  ) { }

  async getAccountBalanceVariations(
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBAccountBalanceVariation[]> {
    const variations = await this.variationsRepository.getAccountBalanceVariations(
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
    const variation = await this.variationsRepository.getAccountBalanceVariationsByAccountId(
      address,
      fromTimestamp,
      toTimestamp,
    );

    if (variation) return variation

    const accountBalance = await this.balanceRepository.getAccountBalance(address);
    const balance = accountBalance?.balance ?? 0n;

    return {
      accountId: address,
      previousBalance: balance,
      currentBalance: balance,
      absoluteChange: 0n,
      percentageChange: "0",
    }
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
