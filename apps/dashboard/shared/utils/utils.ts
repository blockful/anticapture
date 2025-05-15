import { TreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";
import {
  DAYS_IN_MILLISECONDS,
  DAYS_PER_MONTH,
  MILLISECONDS_PER_DAY,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from "@/shared/constants/time-related";
import { TimeInterval } from "@/shared/types/enums";

export function formatBlocksToUserReadable(
  num: number,
  useAbbreviations: boolean = false,
): string {
  // Constants
  const SECONDS_PER_BLOCK = 12;

  // Handle zero or negative blocks
  if (num <= 0) return "0 sec";

  // Convert blocks to seconds
  const totalSeconds = num * SECONDS_PER_BLOCK;

  // For small block counts, just show seconds
  if (num < 5) {
    return formatPlural(Math.round(totalSeconds), "sec");
  }

  return formatSecondsToReadable(totalSeconds, useAbbreviations);
}

// Helper function to convert seconds to a readable time format with optional abbreviations
function formatSecondsToReadable(
  totalSeconds: number,
  useAbbreviations: boolean = false,
): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = Math.round(totalSeconds % SECONDS_PER_MINUTE);

  const parts = [];

  // Add hours if we have any
  if (hours > 0) {
    parts.push(useAbbreviations ? `${hours}h` : formatPlural(hours, "hour"));
  }

  // Add minutes if we have any
  if (minutes > 0) {
    parts.push(
      useAbbreviations ? `${minutes}min` : formatPlural(minutes, "min"),
    );
  }

  // Add seconds only if we have no hours and minutes
  if (parts.length === 0 && seconds > 0) {
    parts.push(useAbbreviations ? `${seconds}s` : formatPlural(seconds, "sec"));
  }

  return parts.join(useAbbreviations ? " " : ", ");
}

// Helper function to format a word with proper pluralization
export function formatPlural(count: number, word: string): string {
  return `${count} ${count === 1 ? word : word + "s"}`;
}

export const formatVariation = (rateRaw: string): string =>
  `${Number(Number(rateRaw) * 100).toFixed(2)}`;

export const timestampToReadableDate = (date: number) => {
  if (isNaN(date) || date === null || date === undefined) return "Invalid Date";

  let dateStr = date.toString();

  while (dateStr.length < 13) {
    dateStr += "0";
  }

  while (dateStr.length > 13) {
    dateStr = (Number(dateStr) / 10).toFixed(0);
  }

  const timestamp = Number(dateStr);

  const newDate = new Date(timestamp);
  if (isNaN(newDate.getTime())) return "Invalid Date";

  return newDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function normalizeDataset(
  tokenPrices: PriceEntry[],
  key: string,
  multiplier?: number | null,
  multiplierDataSet?: DaoMetricsDayBucket[],
): MultilineChartDataSetPoint[] {
  // If there's no multiplier data, use the fixed value or 1 as default
  if (!multiplierDataSet?.length) {
    return tokenPrices
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, price]) => ({
        date: timestamp,
        [key]: price * (multiplier ?? 1),
      }));
  }

  // Prepare multipliers sorted by timestamp
  const sortedMultipliers = multiplierDataSet
    .map((item) => ({
      timestamp: Number(item.date),
      high: Number(item.high) / 1e18,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Sort token prices by timestamp
  const sortedTokenPrices = [...tokenPrices].sort((a, b) => a[0] - b[0]);

  // Transform price data with appropriate multipliers
  return sortedTokenPrices.map(([timestamp, price]) => ({
    date: timestamp,
    [key]:
      price *
      findMostRecentValue(
        sortedMultipliers,
        timestamp,
        "high",
        multiplier != null
          ? multiplier
          : sortedMultipliers.length > 0
            ? sortedMultipliers[0].high
            : 1,
      ),
  }));
}

export function normalizeDatasetTreasuryNonDaoToken(
  tokenPrices: TreasuryAssetNonDaoToken[],
  key: string,
): MultilineChartDataSetPoint[] {
  return tokenPrices.map((item) => {
    return {
      date: new Date(item.date).getTime(),
      [key]: Number(item.totalAssets),
    };
  });
}

// The idea of this function is to have a value per day of the governance token treasury * token price + assets
// The problem is that the governance token treasury is not updated every day, so we need to normalize it
// The solution is to use the last value available for the governance token treasury
export function normalizeDatasetAllTreasury(
  tokenPrices: PriceEntry[],
  key: string,
  assetTreasuries: TreasuryAssetNonDaoToken[],
  governanceTokenTreasuries?: DaoMetricsDayBucket[],
): MultilineChartDataSetPoint[] {
  // Sort all datasets by timestamp for efficient processing
  const sortedAssets = [...assetTreasuries]
    .map((item) => ({
      timestamp: new Date(item.date).getTime(),
      totalAssets: Number(item.totalAssets),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const sortedGovernanceTokenTreasuries = [...(governanceTokenTreasuries ?? [])]
    .map((item) => ({
      timestamp: Number(item.date),
      high: Number(item.high) / 1e18,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const sortedDataset = [...tokenPrices].sort((a, b) => a[0] - b[0]);

  // Map each token price point to a normalized data point
  return sortedDataset.map(([timestamp, price]) => {
    // Find the most recent asset value at or before this timestamp
    const lastAssetValue = findMostRecentValue(
      sortedAssets,
      timestamp,
      "totalAssets",
      sortedAssets.length > 0 ? sortedAssets[0].totalAssets : 0,
    );

    // Find the most recent governance token treasury value at or before this timestamp
    const lastHighValue = findMostRecentValue(
      sortedGovernanceTokenTreasuries,
      timestamp,
      "high",
      sortedGovernanceTokenTreasuries.length > 0
        ? sortedGovernanceTokenTreasuries[0].high
        : 1,
    );

    // Calculate the final value
    const finalValue = price * lastHighValue + lastAssetValue;

    return {
      date: timestamp,
      [key]: finalValue,
    };
  });
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
