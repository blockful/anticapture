import useSWR from "swr";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { TokenMetricItem } from "@/shared/dao-config/types";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import {
  DAYS_IN_SECONDS,
  SECONDS_PER_DAY,
} from "@/shared/constants/time-related";
import axios from "axios";

interface TokenMetricsItem {
  date: string;
  high: string;
  volume: string;
}

interface TokenMetricsResponse {
  additionalProperties: Array<{
    key: string;
    value: {
      items: TokenMetricsItem[];
      pageInfo: {
        hasNextPage: boolean;
        startDate: string | null;
        endDate: string | null;
      };
    };
  }>;
}

const fetchTimeSeries = async (
  daoId: DaoIdEnum,
  days: TimeInterval,
  metricTypes: MetricTypesEnum[],
): Promise<Record<MetricTypesEnum, TokenMetricItem[]>> => {
  const startDate = Math.floor(
    Date.now() / 1000 - DAYS_IN_SECONDS[days] - SECONDS_PER_DAY,
  );

  const typeArray = JSON.stringify(metricTypes);
  const query = `query TokenMetrics {
    tokenMetrics(
      type: ${typeArray}
      startDate: ${startDate}
      orderDirection: asc
      limit: 365
    ) {
      additionalProperties {
        key
        value {
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
      }
    }
  }`;

  const response = await axios.post<{
    data: {
      tokenMetrics: TokenMetricsResponse;
    };
  }>(
    `${BACKEND_ENDPOINT}`,
    {
      query,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "anticapture-dao-id": daoId,
      },
    },
  );

  const { tokenMetrics } = response.data.data;

  // Transform the response from additionalProperties array to Record<MetricTypesEnum, TokenMetricItem[]>
  const metricsByType: Record<MetricTypesEnum, TokenMetricItem[]> =
    {} as Record<MetricTypesEnum, TokenMetricItem[]>;

  // Initialize all requested metric types with empty arrays
  for (const metricType of metricTypes) {
    metricsByType[metricType] = [];
  }

  // Map the additionalProperties array to the expected format
  for (const entry of tokenMetrics.additionalProperties) {
    const metricType = entry.key as MetricTypesEnum;
    if (metricTypes.includes(metricType)) {
      metricsByType[metricType] = entry.value.items;
    }
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
