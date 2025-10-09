import { HTTPException } from "hono/http-exception";
import axios, { AxiosInstance } from "axios";

import {
  CoingeckoHistoricalMarketData,
  CoingeckoHistoricalMarketDataSchema,
  CoingeckoTokenIdEnum,
} from "./types";
import { DAYS_IN_YEAR } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { TokenHistoricalPriceResponse } from "@/api/mappers";

export class CoingeckoService {
  private readonly coingeckoApiUrl = "https://api.coingecko.com/api/v3";
  private readonly client: AxiosInstance;

  constructor(
    private readonly coingeckoApiKey: string,
    private readonly daoId: DaoIdEnum,
  ) {
    this.client = axios.create({
      baseURL: this.coingeckoApiUrl,
      headers: {
        "x-cg-demo-api-key": this.coingeckoApiKey,
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
      price: price.toString(),
      timestamp: timestamp.toString(),
    }));
  }
}
