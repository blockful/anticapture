import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";
import { formatUnits } from "viem";

export function normalizeDataset(
  tokenPrices: PriceEntry[],
  key: string,
  multiplier: number | Pick<DaoMetricsDayBucket, "date" | "high">[],
  decimals: number,
): MultilineChartDataSetPoint[] {
  if (!Array.isArray(multiplier)) {
    return tokenPrices
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ timestamp, price }) => ({
        date: timestamp,
        [key]: Number(price) * multiplier,
      }));
  }

  const multipliersByTs = multiplier.reduce(
    (acc, item) => ({
      ...acc,
      [Number(item.date) * 1000]: Number(
        formatUnits(BigInt(item.high), decimals),
      ),
    }),
    {} as Record<number, number>,
  );

  // Multiply using the exact timestamp's multiplier (may be undefined if missing)
  return [...tokenPrices].reverse().map(({ timestamp, price }) => ({
    date: timestamp,
    [key]: Number(price) * (multipliersByTs[timestamp] ?? 0),
  }));
}

/**
 * Filters historical data to only include entries with timestamps at midnight (00:00:00 UTC).
 * This removes partial data from the current day or any data points that don't represent
 * a complete daily snapshot.
 *
 * @param data - Array of price entries with timestamps
 * @returns Filtered array containing only entries with midnight timestamps
 */
export const getOnlyClosedData = (data: PriceEntry[]): PriceEntry[] => {
  return data.filter((entry) => {
    const dateStr = new Date(entry.timestamp).toISOString();
    return dateStr.endsWith("T00:00:00.000Z");
  });
};
