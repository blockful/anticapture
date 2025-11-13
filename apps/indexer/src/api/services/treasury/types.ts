export interface TreasuryDataPoint {
  date: bigint; // Unix timestamp in seconds (start of day)
  totalTreasury: bigint; // USD value
  treasuryWithoutDaoToken: bigint; // USD value excluding native token
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
