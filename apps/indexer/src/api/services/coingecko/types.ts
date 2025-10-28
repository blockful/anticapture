import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";

enum AssetPlatformEnum {
  // From https://docs.coingecko.com/v3.0.1/reference/token-lists
  ETHEREUM = "ethereum",
  ARBITRUM = "arbitrum-one",
  OPTIMISM = "optimistic-ethereum",
  SCROLL = "scroll",
}

export const CoingeckoTokenIdEnum: Record<DaoIdEnum, string> = {
  ENS: "ethereum-name-service",
  UNI: "uniswap",
  ARB: "arbitrum",
  OP: "optimism",
  GTC: "gitcoin",
  TEST: "ethereum-name-service",
  NOUNS: "nouns",
  SCR: "scroll",
  COMP: "compound-governance-token",
} as const;

export const CoingeckoIdToAssetPlatformId = {
  [CoingeckoTokenIdEnum.UNI]: AssetPlatformEnum.ETHEREUM,
  [CoingeckoTokenIdEnum.ENS]: AssetPlatformEnum.ETHEREUM,
  [CoingeckoTokenIdEnum.ARB]: AssetPlatformEnum.ARBITRUM,
  [CoingeckoTokenIdEnum.OP]: AssetPlatformEnum.OPTIMISM,
  [CoingeckoTokenIdEnum.GTC]: AssetPlatformEnum.ETHEREUM,
  [CoingeckoTokenIdEnum.SCR]: AssetPlatformEnum.SCROLL,
  [CoingeckoTokenIdEnum.COMP]: AssetPlatformEnum.ETHEREUM,
} as const;

export interface CoingeckoHistoricalMarketData {
  prices: [number, number][];
}

export const CoingeckoHistoricalMarketDataSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});
