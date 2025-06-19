export const CoingeckoTokenIdEnum = {
  ENS: "ethereum-name-service",
  UNI: "uniswap",
  ARB: "arbitrum",
} as const;

export type CoingeckoTokenId =
  (typeof CoingeckoTokenIdEnum)[keyof typeof CoingeckoTokenIdEnum];

export interface CoingeckoHistoricalMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export const isCoingeckoHistoricalMarketData = (
  data: any
): data is CoingeckoHistoricalMarketData => {
  return data.prices && data.market_caps && data.total_volumes;
};
