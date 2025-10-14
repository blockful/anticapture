import { z } from "zod";

enum AssetPlatformEnum {
  // From https://docs.coingecko.com/v3.0.1/reference/token-lists
  ETHEREUM = "ethereum",
  ARBITRUM = "arbitrum-one",
  OPTIMISM = "optimistic-ethereum",
}

export const CoingeckoTokenIdEnum = {
  ENS: "ethereum-name-service",
  UNI: "uniswap",
  ARB: "arbitrum",
  OP: "optimism",
  GTC: "gitcoin",
  SCR: "scroll",
} as const;

export const CoingeckoIdToAssetPlatformId = {
  [CoingeckoTokenIdEnum.UNI]: AssetPlatformEnum.ETHEREUM,
  [CoingeckoTokenIdEnum.ENS]: AssetPlatformEnum.ETHEREUM,
  [CoingeckoTokenIdEnum.ARB]: AssetPlatformEnum.ARBITRUM,
  [CoingeckoTokenIdEnum.OP]: AssetPlatformEnum.OPTIMISM,
  [CoingeckoTokenIdEnum.GTC]: AssetPlatformEnum.ETHEREUM,
} as const;

export type CoingeckoTokenId =
  (typeof CoingeckoTokenIdEnum)[keyof typeof CoingeckoTokenIdEnum];

export interface CoingeckoHistoricalMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export const CoingeckoHistoricalMarketDataSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});
