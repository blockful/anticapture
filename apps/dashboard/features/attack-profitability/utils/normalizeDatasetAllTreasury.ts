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
  const assetTreasuriesMap = assetTreasuries.reduce(
    (acc, item) => ({
      ...acc,
      [new Date(item.date).getTime()]: Number(item.totalAssets),
    }),
    {} as Record<number, number>,
  );

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

  // Merge by tokenPrices' timestamps
  return tokenPrices.map(({ timestamp, price }) => ({
    date: timestamp,
    [key]:
      Number(price) * (govTreasuriesMap[timestamp] ?? 0) +
      (assetTreasuriesMap[timestamp] ?? 0),
  }));
}
