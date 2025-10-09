import { DAYS_IN_YEAR } from "@/lib/constants";
import { TokenHistoricalPriceResponse } from "@/api/mappers";

interface Repository {
  getHistoricalNFTPrice(days: number): Promise<TokenHistoricalPriceResponse>;
}

export class NFTPriceService {
  constructor(private readonly repo: Repository) {}

  async getHistoricalTokenData(
    days: number = DAYS_IN_YEAR,
  ): Promise<TokenHistoricalPriceResponse> {
    return this.repo.getHistoricalNFTPrice(days);
  }
}
