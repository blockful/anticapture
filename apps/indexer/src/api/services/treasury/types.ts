export interface TreasuryDataPoint {
  date: bigint; // Unix timestamp in seconds (start of day)
  totalTreasury: bigint; // USD value
  treasuryWithoutDaoToken: bigint; // USD value excluding governance token
}
