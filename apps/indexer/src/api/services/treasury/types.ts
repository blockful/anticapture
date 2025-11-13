export interface TreasuryDataPoint {
  date: bigint; // Unix timestamp in seconds (start of day)
  totalTreasury: number; // USD value
  treasuryWithoutDaoToken: number; // USD value excluding governance token
}
