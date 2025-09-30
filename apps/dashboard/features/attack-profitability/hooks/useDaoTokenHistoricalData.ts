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

const DEFAULT_INTERVAL = TimeInterval.SEVEN_DAYS;
const DEFAULT_CURRENCY = "usd";

export const fetchDaoTokenHistoricalData = async ({
  daoId,
  days = DEFAULT_INTERVAL,
  toCurrency = DEFAULT_CURRENCY,
}: {
  daoId: DaoIdEnum;
  days?: TimeInterval;
  toCurrency?: string;
}): Promise<DaoTokenHistoricalDataResponse | null> => {
  if (daoConfigByDaoId[daoId].supportStage === SupportStageEnum.ELECTION) {
    return null;
  }

  const query = `query GetHistoricalTokenData {
  historicalTokenData(days: _${days}, toCurrency: "${toCurrency}") {
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
  toCurrency,
  config,
}: {
  daoId: DaoIdEnum;
  days?: TimeInterval;
  toCurrency?: string;
  config?: Partial<
    SWRConfiguration<DaoTokenHistoricalDataResponse | null, Error>
  >;
}) => {
  const effectiveDays = days ?? DEFAULT_INTERVAL;
  const effectiveCurrency = toCurrency ?? DEFAULT_CURRENCY;

  const { data, error, isValidating, mutate } =
    useSWR<DaoTokenHistoricalDataResponse | null>(
      ["daoTokenHistoricalData", daoId, days, effectiveDays, effectiveCurrency],
      () =>
        fetchDaoTokenHistoricalData({
          daoId,
          days: effectiveDays,
          toCurrency: effectiveCurrency,
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
