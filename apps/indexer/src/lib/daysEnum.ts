import { MILISECONDS_IN_DAY } from "./constants";

export enum DaysEnum {
  "7d" = 7 * MILISECONDS_IN_DAY,
  "30d" = 30 * MILISECONDS_IN_DAY,
  "90d" = 90 * MILISECONDS_IN_DAY,
  "180d" = 180 * MILISECONDS_IN_DAY,
  "365d" = 365 * MILISECONDS_IN_DAY,
}

export const DaysOpts = ["7d", "30d", "90d", "180d", "365d"] as const;
