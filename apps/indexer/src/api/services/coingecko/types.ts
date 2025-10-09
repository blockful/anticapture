import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";

export const CoingeckoTokenIdEnum: Partial<Record<DaoIdEnum, string>> = {
  ENS: "ethereum-name-service",
  UNI: "uniswap",
  ARB: "arbitrum",
  OP: "optimism",
  GTC: "gitcoin",
  TEST: "ethereum-name-service",
};

export interface CoingeckoHistoricalMarketData {
  prices: [number, number][];
}

export const CoingeckoHistoricalMarketDataSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});
