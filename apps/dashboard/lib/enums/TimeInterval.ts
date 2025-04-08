import { MILLISECONDS_PER_DAY } from "@/lib/client/constants";

export enum TimeInterval {
  SEVEN_DAYS = "7d",
  THIRTY_DAYS = "30d",
  NINETY_DAYS = "90d",
  ONE_YEAR = "365d",
}

export const TIME_INTERVAL_TO_DAYS = {
  [TimeInterval.SEVEN_DAYS]: 7,
  [TimeInterval.THIRTY_DAYS]: 30,
  [TimeInterval.NINETY_DAYS]: 90,
  [TimeInterval.ONE_YEAR]: 365,
};

export const DAYS_IN_MILLISECONDS: Record<TimeInterval, number> = {
  [TimeInterval.SEVEN_DAYS]: 7 * MILLISECONDS_PER_DAY,
  [TimeInterval.THIRTY_DAYS]: 30 * MILLISECONDS_PER_DAY,
  [TimeInterval.NINETY_DAYS]: 90 * MILLISECONDS_PER_DAY,
  [TimeInterval.ONE_YEAR]: 365 * MILLISECONDS_PER_DAY,
};
