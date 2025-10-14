import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";

import { findMostRecentValue } from "@/features/attack-profitability/utils";

export function normalizeDataset(
  tokenPrices: PriceEntry[],
  key: string,
  multiplier: number,
  multiplierDataSet?: DaoMetricsDayBucket[],
  tokenType: "ERC20" | "ERC721" = "ERC20",
): MultilineChartDataSetPoint[] {
  // If there's no multiplier data, use the fixed value or 1 as default
  if (!multiplierDataSet?.length) {
    return tokenPrices
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ timestamp, price }) => ({
        date: timestamp,
        [key]: Number(price) * (multiplier ?? 1),
      }));
  }

  const parsedMultipliers = multiplierDataSet.map((item) => ({
    timestamp: Number(item.date),
    high: tokenType === "ERC721" ? Number(item.high) : Number(item.high) / 1e18,
  }));

  return tokenPrices.map(({ timestamp, price }) => {
    return {
      date: timestamp,
      [key]:
        Number(price) *
        findMostRecentValue(
          parsedMultipliers,
          timestamp,
          "high",
          parsedMultipliers.length > 0 ? parsedMultipliers[0].high : multiplier,
        ),
    };
  });
}
