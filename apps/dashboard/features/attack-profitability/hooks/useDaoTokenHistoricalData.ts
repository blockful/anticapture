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

const TIME_INTERVAL_TO_GQL: Record<TimeInterval, string> = {
  [TimeInterval.ONE_DAY]: "_1d",
  [TimeInterval.SEVEN_DAYS]: "_7d",
  [TimeInterval.THIRTY_DAYS]: "_30d",
  [TimeInterval.NINETY_DAYS]: "_90d",
  [TimeInterval.ONE_YEAR]: "_365d",
};

const DEFAULT_INTERVAL = TimeInterval.SEVEN_DAYS;
const DEFAULT_CURRENCY = "usd";

const mapInterval = (ti: TimeInterval | undefined) =>
  TIME_INTERVAL_TO_GQL[ti as TimeInterval] ??
  TIME_INTERVAL_TO_GQL[DEFAULT_INTERVAL];

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

  const gqlDays = mapInterval(days);

  const query = `query GetHistoricalTokenData {
  historicalTokenData(days: ${gqlDays}, toCurrency: "${toCurrency}") {
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

  const key = daoId
    ? ["daoTokenHistoricalData", daoId, effectiveDays, effectiveCurrency]
    : null;

  const { data, error, isValidating, mutate } =
    useSWR<DaoTokenHistoricalDataResponse | null>(
      key,
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
