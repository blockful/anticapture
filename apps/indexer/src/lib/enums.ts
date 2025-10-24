export enum DaoIdEnum {
  UNI = "UNI",
  ENS = "ENS",
  ARB = "ARB",
  OP = "OP",
  GTC = "GTC",
  NOUNS = "NOUNS",
  TEST = "TEST",
  SCR = "SCR",
  COMP = "COMP",
}

export const SECONDS_IN_DAY = 24 * 60 * 60;

/**
 * Gets the current day timestamp (midnight UTC)
 * Used for forward-fill to ensure data goes up to "today"
 * @returns BigInt timestamp representing the start of the current day
 */
export function getCurrentDayTimestamp(): bigint {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const todayMidnight =
    Math.floor(nowInSeconds / SECONDS_IN_DAY) * SECONDS_IN_DAY;
  return BigInt(todayMidnight);
}

/**
 * Enum representing different time periods in seconds
 * Used for filtering data over specific time ranges
 */
export enum DaysEnum {
  "7d" = 7 * SECONDS_IN_DAY,
  "30d" = 30 * SECONDS_IN_DAY,
  "90d" = 90 * SECONDS_IN_DAY,
  "180d" = 180 * SECONDS_IN_DAY,
  "365d" = 365 * SECONDS_IN_DAY,
}

export const DaysOpts = ["7d", "30d", "90d", "180d", "365d"] as const;
