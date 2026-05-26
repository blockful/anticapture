import {
  QueryInput_LastUpdate_Chart,
  useLastUpdateQuery,
} from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

export enum ChartType {
  CostComparison = "cost_comparison",
  AttackProfitability = "attack_profitability",
  TokenDistribution = "token_distribution",
}

const CHART_TYPE_MAP: Record<ChartType, QueryInput_LastUpdate_Chart> = {
  [ChartType.CostComparison]: QueryInput_LastUpdate_Chart.CostComparison,
  [ChartType.AttackProfitability]:
    QueryInput_LastUpdate_Chart.AttackProfitability,
  [ChartType.TokenDistribution]: QueryInput_LastUpdate_Chart.TokenDistribution,
};

export const useLastUpdate = (daoId: DaoIdEnum, chart: ChartType) => {
  const { data, loading, error } = useLastUpdateQuery({
    variables: {
      chart: CHART_TYPE_MAP[chart],
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  return {
    data: data?.lastUpdate ?? null,
    isLoading: loading,
    error: error || null,
  };
};
