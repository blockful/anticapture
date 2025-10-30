import { DBAccountBalanceVariation } from "@/api/mappers";

interface AccountBalanceRepository {
  getAccountBalanceVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]>;
}

export class BalanceVariationsService {
  constructor(private readonly repository: AccountBalanceRepository) {}

  async getAccountBalanceVariations(
    startTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    return this.repository.getAccountBalanceVariations(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }
}
