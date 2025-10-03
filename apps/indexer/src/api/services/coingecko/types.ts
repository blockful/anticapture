import { DaoIdEnum } from "@/lib/enums";
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
} as const;

export const CoingeckoIdToDaoId: Record<
  (typeof CoingeckoTokenIdEnum)[keyof typeof CoingeckoTokenIdEnum],
  DaoIdEnum
> = {
  [CoingeckoTokenIdEnum.ENS]: DaoIdEnum.ENS,
  [CoingeckoTokenIdEnum.UNI]: DaoIdEnum.UNI,
  [CoingeckoTokenIdEnum.ARB]: DaoIdEnum.ARB,
  [CoingeckoTokenIdEnum.OP]: DaoIdEnum.OP,
  [CoingeckoTokenIdEnum.GTC]: DaoIdEnum.GTC,
};

export const CoingeckoIdToAssetPlatformId: Record<
  (typeof CoingeckoTokenIdEnum)[keyof typeof CoingeckoTokenIdEnum],
  AssetPlatformEnum
> = {
  [CoingeckoTokenIdEnum.UNI]: AssetPlatformEnum.ETHEREUM,
  [CoingeckoTokenIdEnum.ENS]: AssetPlatformEnum.ETHEREUM,
  [CoingeckoTokenIdEnum.ARB]: AssetPlatformEnum.ARBITRUM,
  [CoingeckoTokenIdEnum.OP]: AssetPlatformEnum.OPTIMISM,
  [CoingeckoTokenIdEnum.GTC]: AssetPlatformEnum.ETHEREUM,
};

export type CoingeckoTokenId =
  (typeof CoingeckoTokenIdEnum)[keyof typeof CoingeckoTokenIdEnum];

export interface CoingeckoHistoricalMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoingeckoTokenPriceCompareData {
  [symbol: string]: {
    [symbol: string]: number;
  };
}

export const CoingeckoHistoricalMarketDataSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});

export const CoingeckoTokenPriceCompareDataSchema = z.record(
  z.record(z.number()),
);
