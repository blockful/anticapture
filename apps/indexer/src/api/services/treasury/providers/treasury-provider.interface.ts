import { TreasuryDataPoint } from "../types";

export interface TreasuryProvider {
  /**
   * Fetches historical treasury data for a given DAO.
   * @param daoId - Internal DAO identifier (e.g., 'ENS', 'UNI')
   * @returns Array of historical treasury data points
   */
  fetchTreasury(daoId: string): Promise<TreasuryDataPoint[]>;

  /**
   * Returns list of DAO IDs supported by this provider.
   */
  getSupportedDaos(): string[];
}
