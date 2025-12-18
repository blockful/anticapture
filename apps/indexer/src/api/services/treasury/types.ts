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
 * Enum to set the type of treasury
 */
export enum TreasuryType {
  LIQUID = "liquid",
  DAO_TOKEN = "dao-token",
  TOTAL = "total",
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
