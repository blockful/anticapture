import { z } from "zod";

export const CoingeckoTokenIdEnum = {
  ENS: "ethereum-name-service",
  UNI: "uniswap",
  ARB: "arbitrum",
  OP: "optimism",
  GTC: "gitcoin",
} as const;

export type CoingeckoTokenId =
  (typeof CoingeckoTokenIdEnum)[keyof typeof CoingeckoTokenIdEnum];

export interface CoingeckoHistoricalMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoingeckoTokenPropertyData {
  value: number /* TODO */;
}

export const CoingeckoHistoricalMarketDataSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});

export const CoingeckoTokenPropertyDataSchema = z.object({
  value: z.number() /* TODO */,
});
