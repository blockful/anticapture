import {
  TokenHoldersFilter,
  TokenHoldersResult,
} from "@/api/mappers/token-holders";

interface TokenHoldersRepository {
  getTokenHolders(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderBy: "balance" | "variation",
    orderDirection: "asc" | "desc",
    filter: TokenHoldersFilter,
  ): Promise<TokenHoldersResult>;
}

export class TokenHoldersService {
  constructor(private readonly repository: TokenHoldersRepository) {}

  async getTokenHolders(
    startTimestamp: number,
    skip: number,
    limit: number,
    orderBy: "balance" | "variation",
    orderDirection: "asc" | "desc",
    filter: TokenHoldersFilter,
  ): Promise<TokenHoldersResult> {
    return this.repository.getTokenHolders(
      startTimestamp,
      limit,
      skip,
      orderBy,
      orderDirection,
      filter,
    );
  }
}
