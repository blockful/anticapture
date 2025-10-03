import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";

export enum ChartType {
  CostComparison = "cost_comparison",
  AttackProfitability = "attack_profitability",
  TokenDistribution = "token_distribution",
}

interface LastUpdateResponse {
  lastUpdate: string;
}

export const fetchLastUpdate = async ({
  chart,
  daoId,
}: {
  chart: ChartType;
  daoId: DaoIdEnum;
}): Promise<LastUpdateResponse> => {
  const query = `query LastUpdate {
    lastUpdate(chart: ${chart}) {
        lastUpdate
    }
  }`;
  const response = await axios.post(
    `${BACKEND_ENDPOINT}`,
    {
      query,
    },
    {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  );

  return response.data.data.lastUpdate;
};

export const useLastUpdate = (
  daoId: DaoIdEnum,
  chart: ChartType,
  config?: Partial<SWRConfiguration<LastUpdateResponse, Error>>,
) => {
  return useSWR<LastUpdateResponse>(
    ["lastUpdate", chart],
    async () => {
      return await fetchLastUpdate({ chart, daoId });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
