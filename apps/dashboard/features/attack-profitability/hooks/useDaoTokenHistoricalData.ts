import useSWR, { SWRConfiguration } from "swr";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";

export type PriceEntry = [timestamp: number, value: number];

export interface DaoTokenHistoricalDataResponse {
  prices: PriceEntry[];
  market_caps: PriceEntry[];
  total_volumes: PriceEntry[];
}

export const fetchDaoTokenHistoricalData = async ({
  daoId,
}: {
  daoId: DaoIdEnum;
}): Promise<DaoTokenHistoricalDataResponse | null> => {
  if (daoConfigByDaoId[daoId].supportStage === SupportStageEnum.ELECTION) {
    return null;
  }
  const query = `query GetHistoricalTokenData {
  historicalTokenData(daoId: ${daoId}) {
    total_volumes
    market_caps
    prices {
      timestamp
      value
    }
  }
}`;
  const response = await fetch(
    `${BACKEND_ENDPOINT}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
      }),
    },
  );
  const { historicalTokenData } = (await response.json()) as {
    historicalTokenData: DaoTokenHistoricalDataResponse;
  };
  return historicalTokenData as DaoTokenHistoricalDataResponse;
};

export const useDaoTokenHistoricalData = (
  daoId: DaoIdEnum,
  config?: Partial<SWRConfiguration<DaoTokenHistoricalDataResponse | null, Error>>,
) => {
  const key = daoId ? [`daoTokenHistoricalData`, daoId] : null;

  const { data, error, isValidating, mutate } =
    useSWR<DaoTokenHistoricalDataResponse | null>(
      key,
      () => fetchDaoTokenHistoricalData({ daoId }),
      { revalidateOnFocus: false, ...config },
    );

  return {
    data: data ?? { prices: [] },
    loading: isValidating,
    error,
    refetch: mutate,
  };
};
