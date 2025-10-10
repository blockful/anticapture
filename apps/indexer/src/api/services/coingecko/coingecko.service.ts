import { HTTPException } from "hono/http-exception";
import {
  CoingeckoHistoricalMarketData,
  CoingeckoHistoricalMarketDataSchema,
  CoingeckoIdToAssetPlatformId,
  CoingeckoTokenId,
} from "./types";
import { DAYS_IN_YEAR } from "@/lib/constants";
import z from "zod";

const createCoingeckoTokenPriceDataSchema = (
  tokenContractAddress: string,
  targetCurrency: string,
) =>
  z.object({
    [tokenContractAddress]: z.object({
      [targetCurrency]: z.number(),
    }),
  });

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

  async getTokenPrice(
    tokenId: CoingeckoTokenId,
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<number> {
    try {
      const assetPlatform = CoingeckoIdToAssetPlatformId[tokenId];
      const formattedAddress = tokenContractAddress.toLowerCase();
      const response = await fetch(
        `${this.coingeckoApiUrl}/simple/token_price/${assetPlatform}?contract_addresses=${formattedAddress}&vs_currencies=${targetCurrency}`,
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
      const price = createCoingeckoTokenPriceDataSchema(
        formattedAddress,
        targetCurrency,
      ).parse(data);

      return price[formattedAddress]![targetCurrency]!;
    } catch (error) {
      throw new HTTPException(503, {
        message: "Failed to fetch token property data",
        cause: error,
      });
    }
  }
}
