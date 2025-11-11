export interface TreasuryDataPoint {
  date: string; // ISO format "2024-01-15"
  totalTreasury: string; // USD value
  treasuryWithoutDaoToken: string; // USD value excluding native token
}

export interface RawDefiLlamaResponse {
  chainTvls: Record<
    string,
    {
      tvl: Array<{
        date: number; // Unix timestamp in seconds
        totalLiquidityUSD: number;
      }>;
      tokensInUsd?: Array<unknown>;
      tokens?: Array<unknown>;
    }
  >;
}
