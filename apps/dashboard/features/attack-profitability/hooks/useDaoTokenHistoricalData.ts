import useSWR, { SWRConfiguration } from "swr";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";

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
}): Promise<DaoTokenHistoricalDataResponse> => {
  const response = await fetch(
    `${BACKEND_ENDPOINT}/token/${daoId}/historical-data`,
    { next: { revalidate: 3600 } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch token data: ${response.statusText}`);
  }

  return response.json();
};

export const useDaoTokenHistoricalData = (
  daoId: DaoIdEnum,
  config?: Partial<SWRConfiguration<DaoTokenHistoricalDataResponse, Error>>,
) => {
  const key = daoId ? [`daoTokenHistoricalData`, daoId] : null;

  const { data, error, isValidating, mutate } =
    useSWR<DaoTokenHistoricalDataResponse>(
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
