const SECONDS_IN_DAY = 24 * 60 * 60;

export enum DaysEnum {
  "7d" = 7 * SECONDS_IN_DAY,
  "30d" = 30 * SECONDS_IN_DAY,
  "90d" = 90 * SECONDS_IN_DAY,
  "180d" = 180 * SECONDS_IN_DAY,
  "365d" = 365 * SECONDS_IN_DAY,
}

export const DaysOpts = ["7d", "30d", "90d", "180d", "365d"] as const;
