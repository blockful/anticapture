/**
 * Interface to represent a treasury's data point
 */
export interface LiquidTreasuryDataPoint {
  date: number; // Unix timestamp in seconds (start of day)
  liquidTreasury: number;
}

/**
 * Interface for fetching historical token prices
 */
export interface PriceProvider {
  getHistoricalPricesMap(days: number): Promise<Map<number, number>>;
}
