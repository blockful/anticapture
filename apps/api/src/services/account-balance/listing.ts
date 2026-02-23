import { Address } from "viem";

import { TreasuryAddresses } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { AmountFilter, DBAccountBalance } from "@/mappers";

interface AccountBalanceRepository {
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

  getAccountBalance(accountId: Address): Promise<DBAccountBalance | undefined>;
}

export class AccountBalanceService {
  constructor(private readonly repo: AccountBalanceRepository) {}

  async getAccountBalances(
    daoId: DaoIdEnum,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses: Address[],
    delegates: Address[],
    amountFilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalance[];
    totalCount: bigint;
  }> {
    const excludeAddresses = Object.values(TreasuryAddresses[daoId]);

    return await this.repo.getAccountBalances(
      skip,
      limit,
      orderDirection,
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
