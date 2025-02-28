export enum CoingeckoTokenIdEnum {
  ENS = "ethereum-name-service",
  UNI = "uniswap",
}

export interface CoingeckoHistoricalMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export const isCoingeckoHistoricalMarketData = (
  data: any,
): data is CoingeckoHistoricalMarketData => {
  return data.prices && data.market_caps && data.total_volumes;
};
