import { DBAccountBalanceVariation } from "@/api/mappers";

interface AccountBalanceRepository {
  getTopAccountBalanceVariations(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]>;
}

export class TopBalanceVariationsService {
  constructor(private readonly repository: AccountBalanceRepository) {}

  async getTopAccountBalanceVariations(
    startTimestamp: number,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    return this.repository.getTopAccountBalanceVariations(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }
}
