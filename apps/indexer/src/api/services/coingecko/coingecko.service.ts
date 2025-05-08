import {
  CoingeckoHistoricalMarketData,
  CoingeckoTokenIdEnum,
  isCoingeckoHistoricalMarketData,
} from "./types";
import { DAYS_IN_YEAR } from "@/lib/constants";
import { env } from "@/env";

export class CoingeckoService {
  private readonly coingeckoApiUrl = "https://api.coingecko.com/api/v3";
  constructor(private readonly coingeckoApiKey: string) { }

  async getHistoricalTokenData(
    tokenId: CoingeckoTokenIdEnum,
    days: number = DAYS_IN_YEAR,
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

export const coingeckoService = new CoingeckoService(env.COINGECKO_API_KEY);
