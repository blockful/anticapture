import { LiquidTreasuryDataPoint } from "../types";

export interface TreasuryProvider {
  /**
   * Fetches historical treasury data from the configured provider.
   * Provider-specific DAO ID is configured during instantiation.
   * @param cutoffTimestamp - Only return data points with date >= this timestamp (Unix seconds)
   * @returns Array of historical treasury data points, or empty array if provider is not configured
   */
  fetchTreasury(cutoffTimestamp: bigint): Promise<LiquidTreasuryDataPoint[]>;
}
