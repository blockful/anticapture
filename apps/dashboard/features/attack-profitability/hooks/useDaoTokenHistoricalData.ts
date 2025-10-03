import useSWR, { SWRConfiguration } from "swr";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import axios from "axios";
import { TimeInterval } from "@/shared/types/enums";

export type PriceEntry = [timestamp: number, value: number];

export interface DaoTokenHistoricalDataResponse {
  prices: PriceEntry[];
  market_caps: PriceEntry[];
  total_volumes: PriceEntry[];
}

const DEFAULT_INTERVAL = TimeInterval.ONE_YEAR;

export const fetchDaoTokenHistoricalData = async ({
  daoId,
  days = DEFAULT_INTERVAL,
}: {
  daoId: DaoIdEnum;
  days?: TimeInterval;
}): Promise<DaoTokenHistoricalDataResponse | null> => {
  if (daoConfigByDaoId[daoId].supportStage === SupportStageEnum.ELECTION) {
    return null;
  }

  const query = `query GetHistoricalTokenData {
  historicalTokenData(days: _${days}) {
    market_caps
    prices
  }
}`;
  const response: {
    data: { data: { historicalTokenData: DaoTokenHistoricalDataResponse } };
  } = await axios.post(
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
  const { historicalTokenData } = response.data.data as {
    historicalTokenData: DaoTokenHistoricalDataResponse;
  };
  return historicalTokenData as DaoTokenHistoricalDataResponse;
};

export const useDaoTokenHistoricalData = ({
  daoId,
  days,
  config,
}: {
  daoId: DaoIdEnum;
  days?: TimeInterval;
  config?: Partial<
    SWRConfiguration<DaoTokenHistoricalDataResponse | null, Error>
  >;
}) => {
  const { data, error, isValidating, mutate } =
    useSWR<DaoTokenHistoricalDataResponse | null>(
      ["daoTokenHistoricalData", daoId, days],
      () =>
        fetchDaoTokenHistoricalData({
          daoId,
          days,
        }),
      { revalidateOnFocus: false, ...config },
    );

  return {
    data: data ?? { prices: [] },
    loading: isValidating,
    error,
    refetch: mutate,
  };
};
