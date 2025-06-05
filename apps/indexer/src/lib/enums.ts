export enum DaoIdEnum {
  UNI = "UNI",
  ENS = "ENS",
  ARB = "ARB",
}

export enum NetworkEnum {
  ETHEREUM = "ethereum",
  ARBITRUM = "arbitrum",
  ANVIL = "anvil",
}

/**
 * Enum representing different time periods in seconds
 * Used for filtering data over specific time ranges
 */
export enum DaysEnum {
  "7d" = 7 * 86400,
  "30d" = 30 * 86400,
  "90d" = 90 * 86400,
  "180d" = 180 * 86400,
  "365d" = 365 * 86400,
}
