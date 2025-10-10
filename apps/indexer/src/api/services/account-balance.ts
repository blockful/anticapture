import { DaysEnum } from "@/lib/enums";
import { DBAccountBalanceVariation } from "../mappers/top-account-balance-variations";

interface DrizzleRepository {
  getTopAccountBalanceChanges(
    startTimestamp: number,
    limit: number,
    skip: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]>;
}

export class AccountBalanceService {
  constructor(private readonly drizzleRepository: DrizzleRepository) { }

  async getTopAccountBalanceVariations(
    now: number,
    days: DaysEnum,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<DBAccountBalanceVariation[]> {
    const startTimestamp = now - days;

    return this.drizzleRepository.getTopAccountBalanceChanges(
      startTimestamp,
      limit,
      skip,
      orderDirection,
    );
  }
}
