import axios from "axios";
import useSWR, { SWRConfiguration } from "swr";

import { DaoIdEnum } from "@/shared/types/daos";

type DaoTokenHistoricalDataResponse = {
  historicalTokenData: {
    items: {
      timestamp: number;
      price: number;
    }[];
  };
};

export const fetchDaoTokenHistoricalData = async ({
  daoId,
}: {
  daoId: DaoIdEnum;
}): Promise<DaoTokenHistoricalDataResponse["historicalTokenData"]["items"]> => {
  const query = `query GetHistoricalTokenData {
    historicalTokenData {
      items {
        timestamp
        price
      }
    }
  }`;
  const response = await axios.post<{ data: DaoTokenHistoricalDataResponse }>(
    `${process.env.NEXT_PUBLIC_BASE_URL}`,
    {
      query,
    },
    {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  );

  return response.data.data.historicalTokenData.items;
};

export const useDaoTokenHistoricalData = (
  daoId: DaoIdEnum,
  config?: Partial<
    SWRConfiguration<
      DaoTokenHistoricalDataResponse["historicalTokenData"]["items"],
      Error
    >
  >,
) => {
  const { data, error, isValidating, mutate } = useSWR<
    DaoTokenHistoricalDataResponse["historicalTokenData"]["items"]
  >(
    [`daoTokenHistoricalData`, daoId],
    () => fetchDaoTokenHistoricalData({ daoId }),
    { revalidateOnFocus: false, ...config },
  );

  return {
    data: data || [],
    loading: isValidating,
    error,
    refetch: mutate,
  };
};
