import { DBAccountBalanceVariation } from "@/api/mappers/top-account-balance-variations";
import { DaysEnum } from "@/lib/enums";

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
    now: number,
    days: DaysEnum,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    const startTimestamp = now - days;

    return this.repository.getTopAccountBalanceVariations(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }
}
