import { MultilineChartDataSetPoint } from "@/shared/dao-config/types";
import { TreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";

export function normalizeDatasetTreasuryNonDaoToken(
  tokenPrices: TreasuryAssetNonDaoToken[],
  key: string,
): MultilineChartDataSetPoint[] {
  return tokenPrices.map((item) => {
    return {
      date: new Date(item.date).getTime(),
      [key]: Number(item.totalAssets),
    };
  });
}
