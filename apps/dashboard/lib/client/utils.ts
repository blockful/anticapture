import { TreasuryAssetNonDaoToken } from "@/hooks/useTreasuryAssetNonDaoToken";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "../dao-constants/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toggleScreenScroll = () => {
  const body = document.getElementsByTagName("body")[0];

  if (body.classList.contains("no-scroll")) {
    body.classList.remove("no-scroll");
  } else {
    body.classList.add("no-scroll");
  }
};

export function sanitizeNumber(amount: number) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "Q" },
  ];
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
  const item = lookup.findLast((item) => amount >= item.value);
  return item
    ? (amount / item.value).toFixed(1).replace(regexp, "").concat(item.symbol)
    : "0";
}

export const RED_COLOR = "#FCA5A5";
export const GREEN_COLOR = "#5BB98B";

export function formatNumberUserReadable(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function formatBlocksToUserReadable(num: number): string {
  // Constants
  const SECONDS_PER_BLOCK = 12;

  // Handle zero or negative blocks
  if (num <= 0) return "0 sec";

  // Convert blocks to seconds
  const totalSeconds = num * SECONDS_PER_BLOCK;

  // For small block counts, just show seconds
  if (num < 5) {
    return formatTimeUnit(Math.round(totalSeconds), "sec");
  }

  return formatSecondsToReadable(totalSeconds);
}

// Helper function to convert seconds to a readable time format
function formatSecondsToReadable(totalSeconds: number): string {
  const SECONDS_PER_MINUTE = 60;
  const SECONDS_PER_HOUR = 3600; // 60 minutes * 60 seconds

  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = Math.round(totalSeconds % SECONDS_PER_MINUTE);

  const parts = [];

  // Add hours if we have any
  if (hours > 0) {
    parts.push(formatTimeUnit(hours, "hour"));
  }

  // Add minutes if we have any
  if (minutes > 0) {
    parts.push(formatTimeUnit(minutes, "min"));
  }

  // Add seconds only if we have no hours and minutes
  if (parts.length === 0 && seconds > 0) {
    parts.push(formatTimeUnit(seconds, "sec"));
  }

  return parts.join(", ");
}

// Helper function to format a time unit with proper pluralization
export function formatTimeUnit(count: number, unit: string): string {
  return `${count} ${count === 1 ? unit : unit + "s"}`;
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

  return newDate.toLocaleDateString("en-US");
};

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function normalizeDataset(
  dataset: PriceEntry[],
  key: string,
  multiplier?: number | null,
  multiplierDataSet?: DaoMetricsDayBucket[],
): MultilineChartDataSetPoint[] {
  const sortedMultipliers = [...(multiplierDataSet ?? [])]
    .map((item) => ({
      timestamp: Number(item.date),
      high: Number(item.high) / 1e18,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const sortedDataset = [...dataset].sort((a, b) => a[0] - b[0]);

  let pointer = 0;

  let lastHighValue =
    sortedMultipliers.length > 0 ? sortedMultipliers[0].high : 1;

  const result: MultilineChartDataSetPoint[] = [];

  for (const [timestamp, price] of sortedDataset) {
    while (
      pointer < sortedMultipliers.length - 1 &&
      sortedMultipliers[pointer + 1].timestamp <= timestamp
    ) {
      pointer++;
    }

    if (sortedMultipliers[pointer]?.timestamp <= timestamp) {
      lastHighValue = sortedMultipliers[pointer].high;
    }

    let finalValue = price;
    if (multiplier != null) {
      finalValue *= multiplier;
    } else {
      finalValue *= lastHighValue;
    }

    result.push({
      date: timestamp,
      [key]: finalValue,
    });
  }

  return result;
}

export function normalizeDatasetTreasuryNonDaoToken(
  dataset: TreasuryAssetNonDaoToken[],
  key: string,
): MultilineChartDataSetPoint[] {
  return dataset.map((item) => {
    return {
      date: new Date(item.date).getTime(),
      [key]: Number(item.totalAssets),
    };
  });
}

export function normalizeDatasetAllTreasury(
  dataset: PriceEntry[],
  key: string,
  sumWithAllOtherAssets: TreasuryAssetNonDaoToken[],
  multiplierDataSet?: DaoMetricsDayBucket[],
): MultilineChartDataSetPoint[] {
  const sortedAssets = [...sumWithAllOtherAssets]
    .map((item) => ({
      timestamp: new Date(item.date).getTime(),
      totalAssets: Number(item.totalAssets),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const sortedMultipliers = [...(multiplierDataSet ?? [])]
    .map((item) => ({
      timestamp: Number(item.date),
      high: Number(item.high) / 1e18,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const sortedDataset = [...dataset].sort((a, b) => a[0] - b[0]);

  let pointerAssets = 0;
  let pointerMultis = 0;

  let lastAssetValue =
    sortedAssets.length > 0 ? sortedAssets[0].totalAssets : 0;

  let lastHighValue =
    sortedMultipliers.length > 0 ? sortedMultipliers[0].high : 1;

  const result: MultilineChartDataSetPoint[] = [];

  for (const [timestamp, price] of sortedDataset) {
    while (
      pointerAssets < sortedAssets.length - 1 &&
      sortedAssets[pointerAssets + 1].timestamp <= timestamp
    ) {
      pointerAssets++;
    }

    if (sortedAssets[pointerAssets]?.timestamp <= timestamp) {
      lastAssetValue = sortedAssets[pointerAssets].totalAssets;
    }

    while (
      pointerMultis < sortedMultipliers.length - 1 &&
      sortedMultipliers[pointerMultis + 1].timestamp <= timestamp
    ) {
      pointerMultis++;
    }

    if (sortedMultipliers[pointerMultis]?.timestamp <= timestamp) {
      lastHighValue = sortedMultipliers[pointerMultis].high;
    }

    const finalValue = price * lastHighValue + lastAssetValue;

    result.push({
      date: timestamp,
      [key]: finalValue,
    });
  }

  return result;
}
