import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";
import { formatUnits } from "viem";

export function normalizeDataset(
  tokenPrices: PriceEntry[],
  key: string,
  multiplier: number,
  decimals: number,
  multiplierDataSet?: DaoMetricsDayBucket[],
): MultilineChartDataSetPoint[] {
  if (!multiplierDataSet?.length) {
    return tokenPrices
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ timestamp, price }) => ({
        date: timestamp,
        [key]: Number(price) * multiplier,
      }));
  }

  const multipliersByTs = multiplierDataSet.reduce(
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
