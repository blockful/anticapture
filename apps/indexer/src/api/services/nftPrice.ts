import { TokenHistoricalPriceResponse } from "@/api/mappers";

interface Repository {
  getHistoricalNFTPrice(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse>;
}

export class NFTPriceService {
  constructor(private readonly repo: Repository) {}

  async getHistoricalTokenData(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse> {
    return this.repo.getHistoricalNFTPrice(limit, offset);
  }
}
