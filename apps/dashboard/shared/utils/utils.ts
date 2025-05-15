import { PriceEntry } from "@/shared/dao-config/types";
import {
  DAYS_IN_MILLISECONDS,
  DAYS_PER_MONTH,
  MILLISECONDS_PER_DAY,
  SECONDS_PER_DAY,
} from "@/shared/constants/time-related";
import { TimeInterval } from "@/shared/types/enums";
import { timestampToReadableDate } from "@/shared/utils";

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
