import { MILLISECONDS_IN_DAY } from "./constants";

export enum DaysEnum {
  "7d" = 7 * MILLISECONDS_IN_DAY,
  "30d" = 30 * MILLISECONDS_IN_DAY,
  "90d" = 90 * MILLISECONDS_IN_DAY,
  "180d" = 180 * MILLISECONDS_IN_DAY,
  "365d" = 365 * MILLISECONDS_IN_DAY,
}
