import { milisecondsInDay } from "./constants";

export enum DaysEnum {
  "7d" = 7 * milisecondsInDay,
  "30d" = 30 * milisecondsInDay,
  "90d" = 90 * milisecondsInDay,
  "180d" = 180 * milisecondsInDay,
  "365d" = 365 * milisecondsInDay,
}
