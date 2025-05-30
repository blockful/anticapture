import { PriceEntry } from "@/shared/dao-config/types";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import { TimeInterval } from "@/shared/types/enums";

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

export const calculatePastTimestamp = (
  lastTimestamp: number,
  interval: TimeInterval,
): number => lastTimestamp - DAYS_IN_SECONDS[interval];
