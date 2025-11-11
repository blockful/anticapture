import { MultilineChartDataSetPoint } from "@/shared/dao-config/types";
import { TreasuryAssetData } from "@/features/attack-profitability/hooks";

export function normalizeDatasetTreasuryNonDaoToken(
  treasuryData: TreasuryAssetData[],
  key: string,
): MultilineChartDataSetPoint[] {
  return treasuryData.map((item) => ({
    date: item.date,
    [key]: Number(item.treasuryWithoutDaoToken),
  }));
}
