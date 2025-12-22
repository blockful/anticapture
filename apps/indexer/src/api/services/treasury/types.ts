/**
 * Interface to represent a treasury's data point
 */
export interface LiquidTreasuryDataPoint {
  date: bigint; // Unix timestamp in seconds (start of day)
  liquidTreasury: number;
}

/**
 * Treasury's response to the client
 */
export interface TreasuryResponse {
  items: {
    value: number;
    date: number;
  }[];
  totalCount: number;
}

/**
 * Interface for fetching historical token prices
 */
export interface PriceProvider {
  getHistoricalPrices(days: number): Promise<Map<number, number>>;
}
