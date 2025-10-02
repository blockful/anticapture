import { DaoIdEnum } from "@/lib/enums";
import { z } from "zod";

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
  // Verify necessity of this construct
  [CoingeckoTokenIdEnum.ENS]: DaoIdEnum.ENS,
  [CoingeckoTokenIdEnum.UNI]: DaoIdEnum.UNI,
  [CoingeckoTokenIdEnum.ARB]: DaoIdEnum.ARB,
  [CoingeckoTokenIdEnum.OP]: DaoIdEnum.OP,
  [CoingeckoTokenIdEnum.GTC]: DaoIdEnum.GTC,
};

export type CoingeckoTokenId =
  (typeof CoingeckoTokenIdEnum)[keyof typeof CoingeckoTokenIdEnum];

export interface CoingeckoHistoricalMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoingeckoTokenPriceCompareData {
  value: number /* TODO */;
}

export const CoingeckoHistoricalMarketDataSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});

export const CoingeckoTokenPriceCompareDataSchema = z.object({
  value: z.number() /* TODO */,
});
