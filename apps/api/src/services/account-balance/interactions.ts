import { AccountInteractions, Filter } from "@/mappers";
import { Address } from "viem";

export interface AccountInteractionsRepository {
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

export class AccountInteractionsService {
  constructor(private repo: AccountInteractionsRepository) {}

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
    return this.repo.getAccountInteractions(
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
