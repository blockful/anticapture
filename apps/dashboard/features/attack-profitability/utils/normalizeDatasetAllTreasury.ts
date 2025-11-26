import { TreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";
import { formatUnits } from "viem";

/**
 * Calculates per-day total treasury value:
 *   total = (gov token treasury * gov token price) + non-DAO asset treasuries
 * Uses exact-day values only (no forward-fill). Any continuity should come from upstream.
 */
export function normalizeDatasetAllTreasury(
  tokenPrices: PriceEntry[],
  key: string,
  assetTreasuries: TreasuryAssetNonDaoToken[],
  govTreasuries: DaoMetricsDayBucket[] = [],
  decimals: number, // decimals for the governance token (used with formatUnits)
): MultilineChartDataSetPoint[] {
  // Map: timestamp (ms) -> non-DAO assets value
  const assetTreasuriesMap = assetTreasuries.map((item) => ({
    date: new Date(item.date).getTime(),
    totalAssets: Number(item.totalAssets),
  }));

  // Map: timestamp (ms) -> governance treasury amount (normalized by decimals for ERC20)
  const govTreasuriesMap = govTreasuries.reduce(
    (acc, item) => ({
      ...acc,
      [Number(item.date) * 1000]: Number(
        formatUnits(BigInt(item.close), decimals),
      ),
    }),
    {} as Record<number, number>,
  );

  let currentAssetIndex = 0;
  return tokenPrices.map(({ timestamp, price }) => {
    if (
      timestamp > assetTreasuriesMap[currentAssetIndex]?.date &&
      currentAssetIndex < assetTreasuriesMap.length - 1
    ) {
      currentAssetIndex++;
    }

    return {
      date: timestamp,
      [key]:
        Number(price) * (govTreasuriesMap[timestamp] ?? 1) +
        (assetTreasuriesMap[currentAssetIndex]?.totalAssets ?? 0),
    };
  });
}
