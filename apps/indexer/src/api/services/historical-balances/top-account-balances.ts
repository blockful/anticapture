import { DBAccountBalanceVariation } from "@/api/mappers/top-account-balance-variations";
import { DaysEnum } from "@/lib/enums";

interface AccountBalanceRepository {
  getTopAccountBalanceChanges(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]>;
}

export class TopAccountBalancesService {
  constructor(private readonly repository: AccountBalanceRepository) {}

  async getTopAccountBalanceVariations(
    now: number,
    days: DaysEnum,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    const startTimestamp = now - days;

    return this.repository.getTopAccountBalanceChanges(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }
}
