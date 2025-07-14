import { TreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";

import { findMostRecentValue } from "@/features/attack-profitability/utils";

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
      timestamp: Number(item.date) * 1000,
      close: Number(item.close) / 1e18, // close is the price in the end of the day, for treasury is better if we use this instead of high because generally speaking there is not too many changes in the treasury during the year
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
      "close",
      sortedGovernanceTokenTreasuries.length > 0
        ? sortedGovernanceTokenTreasuries[0].close
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
