import useSWR, { SWRConfiguration } from "swr";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import axios from "axios";
import { TimeInterval } from "@/shared/types/enums";
import { PriceEntry } from "@/shared/dao-config/types";

export const fetchDaoTokenHistoricalData = async ({
  daoId,
}: {
  daoId: DaoIdEnum;
  days?: TimeInterval;
}): Promise<PriceEntry[] | null> => {
  if (daoConfigByDaoId[daoId].supportStage === SupportStageEnum.ELECTION) {
    return null;
  }

  const query = `query GetHistoricalTokenData {
  historicalTokenData {
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
}: {
  daoId: DaoIdEnum;
  days?: TimeInterval;
  config?: Partial<SWRConfiguration<PriceEntry[] | null, Error>>;
}) => {
  const { data, error, isValidating, mutate } = useSWR<PriceEntry[] | null>(
    ["daoTokenHistoricalData", daoId],
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
