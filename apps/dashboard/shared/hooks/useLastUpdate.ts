import { useLastUpdate as useLastUpdateQuery } from "@anticapture/client/hooks";
import type {
  LastUpdatePathParamsDaoEnumKey,
  LastUpdateQueryParamsChartEnumKey,
} from "@anticapture/client";

import type { DaoIdEnum } from "@/shared/types/daos";

export enum ChartType {
  CostComparison = "cost_comparison",
  AttackProfitability = "attack_profitability",
  TokenDistribution = "token_distribution",
}

export const useLastUpdate = (daoId: DaoIdEnum, chart: ChartType) => {
  const { data, isLoading, error } = useLastUpdateQuery(
    daoId.toLowerCase() as LastUpdatePathParamsDaoEnumKey,
    { chart: chart as LastUpdateQueryParamsChartEnumKey },
  );

  return {
    data: data ?? null,
    isLoading,
    error: error ?? null,
  };
};
