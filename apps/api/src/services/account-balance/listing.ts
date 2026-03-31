import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { AmountFilter, DBAccountBalanceWithVariation } from "@/mappers";
import { TreasuryAddresses } from "@/lib/constants";

export interface AccountBalanceRepositoryInterface {
  getAccountBalancesWithVariation(
    variationFromTimestamp: number,
    variationToTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "balance" | "variation" | "signedVariation",
    addresses: Address[],
    delegates: Address[],
    excludeAddresses: Address[],
    amountfilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalanceWithVariation[];
    totalCount: number;
  }>;

  getAccountBalanceWithVariation(
    accountId: Address,
    variationFromTimestamp: number,
    variationToTimestamp: number,
  ): Promise<DBAccountBalanceWithVariation | undefined>;
}

export class AccountBalanceService {
  constructor(private readonly repo: AccountBalanceRepositoryInterface) {}

  async getAccountBalances(
    daoId: DaoIdEnum,
    variationFromTimestamp: number,
    variationToTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "balance" | "variation" | "signedVariation",
    addresses: Address[],
    delegates: Address[],
    amountFilter: AmountFilter,
    excludeDaoAddresses: boolean,
  ): Promise<{
    items: DBAccountBalanceWithVariation[];
    totalCount: number;
  }> {
    const daoAddresses = excludeDaoAddresses
      ? Object.values(TreasuryAddresses[daoId])
      : [];
    return await this.repo.getAccountBalancesWithVariation(
      variationFromTimestamp,
      variationToTimestamp,
      skip,
      limit,
      orderDirection,
      orderBy,
      addresses,
      delegates,
      daoAddresses,
      amountFilter,
    );
  }

  async getAccountBalanceWithVariation(
    accountId: Address,
    variationFromTimestamp: number,
    variationToTimestamp: number,
  ): Promise<DBAccountBalanceWithVariation> {
    const result = await this.repo.getAccountBalanceWithVariation(
      accountId,
      variationFromTimestamp,
      variationToTimestamp,
    );

    if (!result) {
      throw new Error("Account not found");
    }

    return result;
  }
}
