import { HTTPException } from "hono/http-exception";
import {
  CoingeckoHistoricalMarketData,
  CoingeckoHistoricalMarketDataSchema,
  CoingeckoTokenId,
  CoingeckoTokenPropertyData,
  CoingeckoTokenPropertyDataSchema,
} from "./types";
import { DAYS_IN_YEAR } from "@/lib/constants";

export class CoingeckoService {
  private readonly coingeckoApiUrl = "https://api.coingecko.com/api/v3";
  constructor(private readonly coingeckoApiKey: string) {}

  async getHistoricalTokenData(
    tokenId: CoingeckoTokenId,
    days: number = DAYS_IN_YEAR,
  ): Promise<CoingeckoHistoricalMarketData> {
    try {
      const response = await fetch(
        `${this.coingeckoApiUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
        {
          headers: {
            "x-cg-demo-api-key": this.coingeckoApiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return CoingeckoHistoricalMarketDataSchema.parse(data);
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch historical token data",
        cause: error,
      });
    }
  }

  async getTokenProperties(
    tokenId: CoingeckoTokenId,
  ): Promise<CoingeckoTokenPropertyData> {
    try {
      const response = await fetch(
        `${this.coingeckoApiUrl}/simple/token-price/${tokenId}?contract_addresses=${""}&vs_currencies=${""}` /* TODO */,
        {
          headers: {
            "x-cg-demo-api-key": this.coingeckoApiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return CoingeckoTokenPropertyDataSchema.parse(data);
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch token property data",
        cause: error,
      });
    }
  }
}
