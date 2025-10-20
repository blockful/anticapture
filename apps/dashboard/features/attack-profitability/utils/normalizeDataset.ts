import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";

export function normalizeDataset(
  tokenPrices: PriceEntry[],
  key: string,
  multiplier: number,
  tokenType: "ERC20" | "ERC721" = "ERC20",
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

  const parsedMultipliers = multiplierDataSet.reduce(
    (acc, item) => ({
      ...acc,
      [Number(item.date)]:
        tokenType === "ERC721" ? Number(item.high) : Number(item.high) / 1e18,
    }),
    {} as Record<number, number>,
  );

  return tokenPrices.map(({ timestamp, price }) => ({
    date: timestamp,
    [key]: Number(price) * parsedMultipliers[timestamp],
  }));
}
