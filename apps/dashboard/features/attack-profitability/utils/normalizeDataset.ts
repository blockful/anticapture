import { SECONDS_PER_DAY } from "@/shared/constants/time-related";
import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";
import { formatEther } from "viem";

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
    (acc, item) => {
      const value =
        tokenType === "ERC721"
          ? Number(item.high)
          : Number(formatEther(BigInt(item.high)));

      return {
        ...acc,
        [Number(item.date) * 1000]: value,
        // Forward fill the value for the next day that will be overwritten
        // by the next day's value if it exists
        [(Number(item.date) + SECONDS_PER_DAY) * 1000]: value,
      };
    },
    {} as Record<number, number>,
  );

  return tokenPrices.map(({ timestamp, price }) => ({
    date: timestamp,
    [key]: Number(price) * parsedMultipliers[timestamp],
  }));
}
