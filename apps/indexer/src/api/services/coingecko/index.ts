import { HTTPException } from "hono/http-exception";
import axios, { AxiosInstance } from "axios";
import { z } from "zod";

import {
  CoingeckoHistoricalMarketData,
  CoingeckoHistoricalMarketDataSchema,
  CoingeckoIdToAssetPlatformId,
  CoingeckoTokenIdEnum,
} from "./types";
import { DAYS_IN_YEAR } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { TokenHistoricalPriceResponse } from "@/api/mappers";

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
  private readonly client: AxiosInstance;

  constructor(
    coingeckoApiUrl: string,
    coingeckoApiKey: string,
    private readonly daoId: DaoIdEnum,
  ) {
    this.client = axios.create({
      baseURL: coingeckoApiUrl,
      headers: {
        "x-cg-demo-api-key": coingeckoApiKey,
      },
    });
  }

  async getHistoricalTokenData(
    days: number = DAYS_IN_YEAR,
  ): Promise<TokenHistoricalPriceResponse> {
    const tokenId = CoingeckoTokenIdEnum[this.daoId];

    if (!tokenId) {
      throw new HTTPException(404, {
        message: "Token not found",
      });
    }

    const response = await this.client.get<CoingeckoHistoricalMarketData>(
      `/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
    );

    const { success, data } = CoingeckoHistoricalMarketDataSchema.safeParse(
      response.data,
    );

    if (!success) {
      throw new HTTPException(503, {
        message: "Failed to fetch historical token data",
        cause: data,
      });
    }

    return data.prices.map(([timestamp, price]) => ({
      price: price.toFixed(2),
      timestamp: timestamp,
    }));
  }

  async getTokenPrice(
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<string> {
    const tokenId = CoingeckoTokenIdEnum[this.daoId];
    const assetPlatform = CoingeckoIdToAssetPlatformId[tokenId];
    const formattedAddress = tokenContractAddress.toLowerCase();
    const response = await this.client.get(
      `/simple/token_price/${assetPlatform}?contract_addresses=${formattedAddress}&vs_currencies=${targetCurrency}`,
    );

    const data = await response.data();
    const { success, data: price } = createCoingeckoTokenPriceDataSchema(
      formattedAddress,
      targetCurrency,
    ).safeParse(data);

    if (!success) {
      throw new HTTPException(503, {
        message: "Failed to fetch token property data",
        cause: data,
      });
    }

    return price[formattedAddress]![targetCurrency]!.toString();
  }
}
