import axios from "axios";
import useSWR from "swr";

import {
  DAYS_IN_SECONDS,
  SECONDS_PER_DAY,
} from "@/shared/constants/time-related";
import { TokenMetricItem } from "@/shared/dao-config/types";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";

interface TokenMetricsItem {
  date: string;
  high: string;
  volume: string;
}

interface TokenMetricsResponse {
  items: TokenMetricsItem[];
  pageInfo: {
    hasNextPage: boolean;
    startDate: string | null;
    endDate: string | null;
  };
}

const fetchSingleMetric = async (
  daoId: DaoIdEnum,
  metricType: MetricTypesEnum,
  startDate: number,
): Promise<TokenMetricItem[]> => {
  const query = `query TokenMetrics {
    tokenMetrics(
      metricType: ${metricType}
      startDate: ${startDate}
      orderDirection: asc
      limit: 365
    ) {
      items {
        date
        high
        volume
      }
      pageInfo {
        hasNextPage
        startDate
        endDate
      }
    }
  }`;

  const response = await axios.post<{
    data: {
      tokenMetrics: TokenMetricsResponse;
    };
  }>(
    `${BACKEND_ENDPOINT}`,
    { query },
    {
      headers: {
        "Content-Type": "application/json",
        "anticapture-dao-id": daoId,
      },
    },
  );

  return response.data.data.tokenMetrics.items;
};

const fetchTimeSeries = async (
  daoId: DaoIdEnum,
  days: TimeInterval,
  metricTypes: MetricTypesEnum[],
): Promise<Record<MetricTypesEnum, TokenMetricItem[]>> => {
  const startDate = Math.floor(
    Date.now() / 1000 - DAYS_IN_SECONDS[days] - SECONDS_PER_DAY,
  );

  // Fetch all metric types in parallel
  const results = await Promise.all(
    metricTypes.map(async (metricType) => ({
      metricType,
      items: await fetchSingleMetric(daoId, metricType, startDate),
    })),
  );

  // Transform results to Record<MetricTypesEnum, TokenMetricItem[]>
  const metricsByType = {} as Record<MetricTypesEnum, TokenMetricItem[]>;
  for (const { metricType, items } of results) {
    metricsByType[metricType] = items;
  }

  return metricsByType;
};

/**
 * Hook for fetching time series data with optimized caching strategy.
 * Now uses the new tokenMetrics API endpoint which returns simplified data.
 */
export const useTimeSeriesData = (
  daoId: DaoIdEnum,
  metricTypes: MetricTypesEnum[],
  days: TimeInterval,
  options?: {
    refreshInterval?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  },
) => {
  const stableMetricTypes = [...metricTypes].sort();

  const fetchKey =
    daoId && stableMetricTypes.length > 0
      ? [`timeSeriesData-bulk`, daoId, stableMetricTypes.join(",")]
      : null;

  const { data, error, isLoading } = useSWR(
    fetchKey,
    () => fetchTimeSeries(daoId, days, stableMetricTypes),
    {
      refreshInterval: options?.refreshInterval ?? 0,
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
      revalidateOnMount: true,
      revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
      revalidateIfStale: true,
      dedupingInterval: 5000,
      keepPreviousData: true,
    },
  );

  return {
    data,
    error,
    isLoading,
  };
};
