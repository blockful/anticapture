import { getApiConfig } from "@/api/config/config";
import {
  CoingeckoHistoricalMarketData,
  CoingeckoTokenIdEnum,
  isCoingeckoHistoricalMarketData,
} from "./types";

export class CoingeckoService {
  private readonly coingeckoApiUrl = "https://api.coingecko.com/api/v3";
  constructor(private readonly coingeckoApiKey: string) {}

  async getHistoricalTokenData(
    tokenId: CoingeckoTokenIdEnum,
    days: number = 365,
  ): Promise<CoingeckoHistoricalMarketData> {
    const response = await fetch(
      `${this.coingeckoApiUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          "x-cg-demo-api-key": this.coingeckoApiKey,
        },
      },
    );
    const data = await response.json();
    if (!isCoingeckoHistoricalMarketData(data)) {
      throw new Error("Invalid response from Coingecko");
    }
    return data as CoingeckoHistoricalMarketData;
  }
}

const config = getApiConfig();
export const coingeckoService = new CoingeckoService(config.coingeckoApiKey);
