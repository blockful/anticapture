import { AmountFilter, DBAccountBalance } from "@/api/mappers";
import { Address } from "viem";

interface AccountBalanceRepository {
  getAccountBalances(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    includeAddresses: Address[],
    excludeAddresses: Address[],
    includeDelegates: Address[],
    excludeDelegates: Address[],
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
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    includeAddresses: Address[],
    excludeAddresses: Address[],
    includeDelegates: Address[],
    excludeDelegates: Address[],
    amountFilter: AmountFilter,
  ): Promise<{
    items: DBAccountBalance[];
    totalCount: bigint;
  }> {
    return await this.repo.getAccountBalances(
      skip,
      limit,
      orderDirection,
      includeAddresses,
      excludeAddresses,
      includeDelegates,
      excludeDelegates,
      amountFilter,
    );
  }

  async getAccountBalance(accountId: Address): Promise<DBAccountBalance> {
    const result = await this.repo.getAccountBalance(accountId);

    if (!result) {
      throw new Error("Not found"); // Review error handling
    }

    return result;
  }
}
