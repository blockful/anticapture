import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";

import { findMostRecentValue } from "@/shared/utils/utils";

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
