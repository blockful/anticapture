import { TreasuryDataPoint } from "../types";

export interface TreasuryProvider {
  /**
   * Fetches historical treasury data from the configured provider.
   * Provider-specific DAO ID is configured during instantiation.
   * @returns Array of historical treasury data points, or empty array if provider is not configured
   */
  fetchTreasury(): Promise<TreasuryDataPoint[]>;
}
