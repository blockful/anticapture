/**
 * Interface to represent a treasury's data point
 */
export interface TreasuryDataPoint {
  date: bigint; // Unix timestamp in seconds (start of day)
  liquidTreasury: number;
  tokenTreasury?: number;
  totalTreasury?: number;
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
