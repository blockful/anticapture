import { LiquidTreasuryDataPoint } from "../types";

export interface TreasuryProvider {
  /**
   * Fetches historical treasury data from the configured provider.
   * Provider-specific DAO ID is configured during instantiation.
   * @param cutoffTimestamp - Only return data points with date >= this timestamp (Unix seconds)
   * @returns Array of historical treasury data points, or empty array if provider is not configured
   */
  fetchTreasury(cutoffTimestamp: number): Promise<LiquidTreasuryDataPoint[]>;

  /**
   * Last good data this provider holds, for serving after a failed fetch.
   * Null when nothing was ever fetched or what is held is too old to serve.
   */
  getStaleTreasury(): LiquidTreasuryDataPoint[] | null;
}
