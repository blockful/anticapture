import { TimeInterval } from "@/shared/types/enums/TimeInterval";

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_DAY = 86400;
export const MILLISECONDS_PER_SECOND = 1000;
export const MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * 60;
export const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_SECOND * 60 * 60;
export const MILLISECONDS_PER_DAY = SECONDS_PER_DAY * MILLISECONDS_PER_SECOND;
export const DAYS_PER_MONTH = 30;

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
