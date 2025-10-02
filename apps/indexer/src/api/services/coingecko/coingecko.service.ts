import { HTTPException } from "hono/http-exception";
import {
  CoingeckoHistoricalMarketData,
  CoingeckoHistoricalMarketDataSchema,
  CoingeckoIdToDaoId,
  CoingeckoTokenId,
  CoingeckoTokenPriceCompareData,
  CoingeckoTokenPriceCompareDataSchema,
} from "./types";
import { CONTRACT_ADDRESSES, DAYS_IN_YEAR } from "@/lib/constants";

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

  async getTokenPriceCompare(
    tokenId: CoingeckoTokenId,
    vsCurrency: string = "eth", // TODO
  ): Promise<CoingeckoTokenPriceCompareData> {
    try {
      const tokenContractAddress =
        CONTRACT_ADDRESSES[CoingeckoIdToDaoId[tokenId]].token.address;
      const response = await fetch(
        `${this.coingeckoApiUrl}/simple/token-price/${tokenId}?contract_addresses=${tokenContractAddress}&vs_currencies=${vsCurrency}`,
        // tokenId is being used incorrectly here, verify which tokens live on which chains and inject coingecko asset-platform id with research team
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
      return CoingeckoTokenPriceCompareDataSchema.parse(data);
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch token property data",
        cause: error,
      });
    }
  }
}
