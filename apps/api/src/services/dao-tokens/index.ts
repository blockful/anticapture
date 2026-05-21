import axios, { AxiosInstance } from "axios";

import { DaoIdEnum } from "@/lib/enums";
import { logger } from "@/logger";
import type { DaoTokenItem } from "@/mappers/token";
import {
  AssetPlatformEnum,
  CoingeckoIdToAssetPlatformId,
  CoingeckoTokenIdEnum,
  CoingeckoTokenListSchema,
} from "@/services/coingecko/types";

const CACHE_TTL_MS = 60 * 60 * 1000;

export class DaoTokensService {
  private readonly client: AxiosInstance;
  private readonly platform: AssetPlatformEnum;
  private cache: DaoTokenItem[] | null = null;
  private cacheExpiresAt = 0;

  constructor(
    coingeckoApiUrl: string,
    coingeckoApiKey: string,
    daoId: DaoIdEnum,
  ) {
    this.client = axios.create({
      baseURL: coingeckoApiUrl,
      headers: { "x-cg-demo-api-key": coingeckoApiKey },
    });
    this.platform = CoingeckoIdToAssetPlatformId[CoingeckoTokenIdEnum[daoId]]!;
  }

  async getAvailableTokens(): Promise<DaoTokenItem[]> {
    if (this.cache && Date.now() < this.cacheExpiresAt) return this.cache;

    try {
      const response = await this.client.get(
        `/token_lists/${this.platform}/all.json`,
      );

      const { tokens } = CoingeckoTokenListSchema.parse(response.data);

      const result = tokens.map((token) => ({
        address: token.address.toLowerCase(),
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUri: token.logoURI ?? null,
      }));

      this.cache = result;
      this.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      return result;
    } catch (error) {
      logger.error({ err: error }, "failed to fetch token list from CoinGecko");
      return this.cache ?? [];
    }
  }
}
