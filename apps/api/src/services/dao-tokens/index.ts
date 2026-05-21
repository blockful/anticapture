import axios, { AxiosInstance } from "axios";
import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";
import type { DaoTokenItem } from "@/mappers/token";
import { AssetPlatformEnum } from "@/services/coingecko/types";

const DaoIdToPlatform: Record<DaoIdEnum, AssetPlatformEnum> = {
  [DaoIdEnum.AAVE]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.ENS]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.UNI]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.ARB]: AssetPlatformEnum.ARBITRUM,
  [DaoIdEnum.OP]: AssetPlatformEnum.OPTIMISM,
  [DaoIdEnum.GTC]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.LIL_NOUNS]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.NOUNS]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.SCR]: AssetPlatformEnum.SCROLL,
  [DaoIdEnum.COMP]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.OBOL]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.ZK]: AssetPlatformEnum.ZKSYNC,
  [DaoIdEnum.SHU]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.FLUID]: AssetPlatformEnum.ETHEREUM,
};

const CoingeckoTokenListSchema = z.object({
  tokens: z.array(
    z.object({
      address: z.string(),
      name: z.string(),
      symbol: z.string(),
      decimals: z.number().int(),
      logoURI: z.string().nullable().optional(),
    }),
  ),
});

export class DaoTokensService {
  private readonly client: AxiosInstance;
  private readonly platform: AssetPlatformEnum;

  constructor(
    coingeckoApiUrl: string,
    coingeckoApiKey: string,
    daoId: DaoIdEnum,
  ) {
    this.client = axios.create({
      baseURL: coingeckoApiUrl,
      headers: { "x-cg-demo-api-key": coingeckoApiKey },
    });
    this.platform = DaoIdToPlatform[daoId];
  }

  async getAvailableTokens(): Promise<DaoTokenItem[]> {
    try {
      const response = await this.client.get(
        `/token_lists/${this.platform}/all.json`,
      );

      const { tokens } = CoingeckoTokenListSchema.parse(response.data);

      return tokens.map((token) => ({
        address: token.address.toLowerCase(),
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUri: token.logoURI ?? null,
        price: null,
        priceChange24h: null,
      }));
    } catch {
      return [];
    }
  }
}
