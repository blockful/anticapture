import { TreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";

import { formatEther } from "viem";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";

// The idea of this function is to have a value per day of the governance token treasury * token price + assets
// The problem is that the governance token treasury is not updated every day, so we need to normalize it
// The solution is to use the last value available for the governance token treasury
// TODO this can be abstracted to the same structure as normalizeDataset
export function normalizeDatasetAllTreasury(
  tokenPrices: PriceEntry[],
  key: string,
  tokenType: "ERC20" | "ERC721",
  assetTreasuries: TreasuryAssetNonDaoToken[],
  govTreasuries: DaoMetricsDayBucket[] = [],
): MultilineChartDataSetPoint[] {
  const assetTreasuriesMap = [...assetTreasuries].reduce(
    (acc, item) => ({
      ...acc,
      [new Date(item.date).getTime()]: Number(item.totalAssets),
    }),
    {} as Record<number, number>,
  );

  const govTreasuriesMap = govTreasuries.reduce(
    (acc, item) => {
      const value =
        tokenType === "ERC721"
          ? Number(item.close)
          : Number(formatEther(BigInt(item.close)));

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
    [key]:
      Number(price) * govTreasuriesMap[timestamp] +
      (assetTreasuriesMap[timestamp] ?? 0),
  }));
}
