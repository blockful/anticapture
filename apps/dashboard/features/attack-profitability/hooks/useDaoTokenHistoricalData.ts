import useSWR, { SWRConfiguration } from "swr";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import axios from "axios";
import { PriceEntry } from "@/shared/dao-config/types";

export const fetchDaoTokenHistoricalData = async ({
  daoId,
  limit,
}: {
  daoId: DaoIdEnum;
  limit?: number;
}): Promise<PriceEntry[] | null> => {
  const query = `query GetHistoricalTokenData($limit: Float) {
    historicalTokenData(limit: $limit) {
      price
      timestamp
    }
  }`;
  const response = await axios.post<{
    data: { historicalTokenData: PriceEntry[] };
  }>(
    `${BACKEND_ENDPOINT}`,
    {
      query,
      variables: {
        limit,
      },
    },
    {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  );
  return response.data.data.historicalTokenData;
};

export const useDaoTokenHistoricalData = ({
  daoId,
  config,
  limit,
}: {
  daoId: DaoIdEnum;
  limit?: number;
  config?: Partial<SWRConfiguration<PriceEntry[] | null, Error>>;
}) => {
  const { data, error, isValidating, mutate } = useSWR<PriceEntry[] | null>(
    ["daoTokenHistoricalData", daoId, limit],
    () =>
      fetchDaoTokenHistoricalData({
        daoId,
      }),
    { revalidateOnFocus: false, ...config },
  );

  return {
    data: data ?? [],
    loading: isValidating,
    error,
    refetch: mutate,
  };
};
