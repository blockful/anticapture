import { TokenHistoricalPriceResponse } from "@/api/mappers";

interface Repository {
  getHistoricalNFTPrice(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse>;
  getTokenPrice(): Promise<string>;
}

export class NFTPriceService {
  constructor(private readonly repo: Repository) {}

  async getHistoricalTokenData(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse> {
    return this.repo.getHistoricalNFTPrice(limit, offset);
  }

  async getTokenPrice(_: string, __: string): Promise<string> {
    return this.repo.getTokenPrice();
  }
}
