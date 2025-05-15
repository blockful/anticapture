import { PriceEntry } from "@/shared/dao-config/types";
import {
  DAYS_IN_MILLISECONDS,
  DAYS_PER_MONTH,
  MILLISECONDS_PER_DAY,
  SECONDS_PER_DAY,
} from "@/shared/constants/time-related";
import { TimeInterval } from "@/shared/types/enums";
import { timestampToReadableDate } from "@/shared/utils";

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generic helper function to find the most recent value at or before a given timestamp
export const findMostRecentValue = <
  T extends { timestamp: number },
  K extends keyof T,
>(
  items: T[],
  targetTimestamp: number,
  valueKey: K,
  defaultValue: T[K],
): T[K] => {
  if (items.length === 0) return defaultValue;

  // Find the index of the last item with timestamp <= targetTimestamp
  const index = items.findLastIndex(
    (item) => item.timestamp <= targetTimestamp,
  );

  // If no item found, return the first item's value or default
  if (index === -1) {
    return items[0]?.timestamp <= targetTimestamp
      ? items[0][valueKey]
      : defaultValue;
  }

  // Return the found item's value
  return items[index][valueKey];
};

export const calculateMonthsBefore = ({
  timestamp,
  monthsBeforeTimestamp,
}: {
  timestamp: number;
  monthsBeforeTimestamp: number;
}): number => {
  const SECONDS_TO_SUBTRACT =
    monthsBeforeTimestamp * DAYS_PER_MONTH * SECONDS_PER_DAY;
  return timestamp - SECONDS_TO_SUBTRACT;
};

export const calculatePastTimestamp = (
  lastTimestamp: number,
  interval: TimeInterval,
): number => lastTimestamp - DAYS_IN_MILLISECONDS[interval];

export const getDateRange = (days: string) => {
  if (!days) return "";

  const numDays = parseInt(days.replace("d", ""));

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endTimestamp = now.getTime();

  const startTimestamp = endTimestamp - numDays * MILLISECONDS_PER_DAY;

  return `${timestampToReadableDate(startTimestamp)} - ${timestampToReadableDate(endTimestamp)}`;
};

export type FilteredChartData = {
  full: PriceEntry[];
} & Record<TimeInterval, PriceEntry[]>;

export const filterPriceHistoryByTimeInterval = (
  dataset: PriceEntry[],
): FilteredChartData => {
  if (dataset.length === 0) {
    return {
      full: dataset,
      [TimeInterval.SEVEN_DAYS]: [],
      [TimeInterval.THIRTY_DAYS]: [],
      [TimeInterval.NINETY_DAYS]: [],
      [TimeInterval.ONE_YEAR]: [],
    };
  }

  const lastTimestamp = dataset[dataset.length - 1][0];

  const cutoffTimestamps = Object.values(TimeInterval).reduce(
    (acc, interval) => {
      acc[interval] = calculatePastTimestamp(lastTimestamp, interval);
      return acc;
    },
    {} as Record<TimeInterval, number>,
  );

  return {
    full: dataset,
    ...Object.values(TimeInterval).reduce(
      (acc, interval) => {
        acc[interval] = dataset.filter(
          ([timestamp]) => timestamp >= cutoffTimestamps[interval],
        );
        return acc;
      },
      {} as Record<TimeInterval, PriceEntry[]>,
    ),
  };
};
