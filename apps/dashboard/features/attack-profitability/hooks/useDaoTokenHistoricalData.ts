import axios from "axios";
import useSWR, { SWRConfiguration } from "swr";

import { getOnlyClosedData } from "@/features/attack-profitability/utils/normalizeDataset";
import { PriceEntry } from "@/shared/dao-config/types";
import { DaoIdEnum } from "@/shared/types/daos";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";

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
  closedDataOnly = true,
}: {
  daoId: DaoIdEnum;
  limit?: number;
  config?: Partial<SWRConfiguration<PriceEntry[] | null, Error>>;
  closedDataOnly?: boolean;
}) => {
  const { data, error, isValidating, mutate } = useSWR<PriceEntry[] | null>(
    ["daoTokenHistoricalData", daoId, limit],
    () =>
      fetchDaoTokenHistoricalData({
        daoId,
        limit,
      }),
    { revalidateOnFocus: false, ...config },
  );

  const closedDataOnlyData =
    closedDataOnly && data ? getOnlyClosedData(data) : data;

  return {
    data: closedDataOnlyData ?? [],
    loading: isValidating,
    error,
    refetch: mutate,
  };
};
