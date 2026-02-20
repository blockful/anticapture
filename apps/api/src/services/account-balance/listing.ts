import { AmountFilter, DBAccountBalance, DBAccountBalanceWithVariation } from "@/mappers";
import { TreasuryAddresses } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { Address } from "viem";

interface AccountBalanceRepository {
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

  getAccountBalance(accountId: Address): Promise<DBAccountBalance | undefined>;
}

export class AccountBalanceService {
  constructor(private readonly repo: AccountBalanceRepository) { }

  async getAccountBalances(
    daoId: DaoIdEnum,
    variationFromTimestamp: number,
    variationToTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "balance" | "variation",
    addresses: Address[],
    delegates: Address[],
    amountFilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalanceWithVariation[];
    totalCount: bigint;
  }> {
    const excludeAddresses = Object.values(TreasuryAddresses[daoId]);
    return await this.repo.getAccountBalancesWithVariation(
      variationFromTimestamp,
      variationToTimestamp,
      skip,
      limit,
      orderDirection,
      orderBy,
      addresses,
      delegates,
      excludeAddresses,
      amountFilter,
    );
  }

  async getAccountBalance(accountId: Address): Promise<DBAccountBalance> {
    const result = await this.repo.getAccountBalance(accountId);

    if (!result) {
      throw new Error("Account not found");
    }

    return result;
  }
}
