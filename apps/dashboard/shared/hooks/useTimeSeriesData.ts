import useSWR from "swr";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import {
  DAYS_IN_SECONDS,
  SECONDS_PER_DAY,
} from "@/shared/constants/time-related";
import axios from "axios";

const fetchTimeSeries = async (
  daoId: DaoIdEnum,
  days: TimeInterval,
  metricTypes: MetricTypesEnum[],
): Promise<Record<MetricTypesEnum, DaoMetricsDayBucket[]>> => {
  const fromDate = String(
    Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days] - SECONDS_PER_DAY,
  ).slice(0, 10);

  const whereConditions = metricTypes
    .map(
      (metricType) => `
      ${metricType}: daoMetricsDayBuckets(
        where: {
          metricType: ${metricType},
          date_gte: "${fromDate}",
          daoId: "${daoId}"
        },
        orderBy: "date",
        orderDirection: "asc",
        limit: 367
      ) {
        items {
          date
          daoId
          tokenId
          metricType
          open
          close
          low
          high
          average
          volume
          count
          volume
        }
      }
    `,
    )
    .join("\n");

  const response = await axios.post<{
    data: {
      [key in MetricTypesEnum]: {
        items: DaoMetricsDayBucket[];
      };
    };
  }>(
    `${BACKEND_ENDPOINT}`,
    {
      query: `query DaoMetricsDayBuckets { ${whereConditions} }`,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "anticapture-dao-id": daoId,
      },
    },
  );
  const { data } = response.data;
  const metricsByType: Record<MetricTypesEnum, DaoMetricsDayBucket[]> =
    {} as Record<MetricTypesEnum, DaoMetricsDayBucket[]>;

  for (const metricType of metricTypes) {
    metricsByType[metricType] = data?.[metricType]?.items || [];
  }

  return metricsByType;
};

/**
 * Fill the gaps in the dailyMetricBuckets using forward-fill logic.
 */
const applyMetricsContinuity = (
  data: Record<MetricTypesEnum, DaoMetricsDayBucket[]> | undefined,
  metricTypes: MetricTypesEnum[],
): Record<MetricTypesEnum, DaoMetricsDayBucket[]> | undefined => {
  if (!data) return undefined;

  const metricsWithContinuity: Record<MetricTypesEnum, DaoMetricsDayBucket[]> =
    {} as Record<MetricTypesEnum, DaoMetricsDayBucket[]>;

  for (const metricType of metricTypes) {
    const series = data[metricType];
    if (!series?.length) {
      metricsWithContinuity[metricType] = [];
      continue;
    }

    const sortedSeries = [...series].sort(
      (a, b) => Number(a.date) - Number(b.date),
    );

    // Build a map with forward-fill logic
    const parsedSeries = sortedSeries.reduce(
      (acc, item) => {
        const timestamp = Number(item.date) * 1000;

        acc[timestamp] = item;

        // Forward-fill for the next day — overwritten if real value exists
        const nextDay = timestamp + 24 * 60 * 60 * 1000;
        acc[nextDay] = acc[nextDay] ?? item;

        return acc;
      },
      {} as Record<number, DaoMetricsDayBucket>,
    );

    // Convert timestamps back into sorted DaoMetricsDayBucket array
    const filledSeries = Object.entries(parsedSeries)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([ts, item]) => ({
        ...item,
        date: String(Math.floor(Number(ts) / 1000)),
      }));

    metricsWithContinuity[metricType] = filledSeries;
  }

  return metricsWithContinuity;
};

/**
 * Hook for fetching time series data with optimized caching strategy
 * Now uses individual metric caching to prevent unnecessary refetches
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
  // For backward compatibility, fall back to bulk fetch if needed
  // But with optimized cache key that doesn't change on metric removal
  const stableMetricTypes = [...metricTypes].sort(); // Stable sort for consistent cache key

  const fetchKey =
    daoId && stableMetricTypes.length > 0
      ? [`timeSeriesData-bulk`, daoId, stableMetricTypes.join(",")]
      : null;

  const {
    data: fullData,
    error,
    isLoading,
  } = useSWR(fetchKey, () => fetchTimeSeries(daoId, days, stableMetricTypes), {
    refreshInterval: options?.refreshInterval ?? 0,
    revalidateOnFocus: options?.revalidateOnFocus ?? true,
    revalidateOnMount: true,
    revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
    revalidateIfStale: true,
    dedupingInterval: 5000, // Increased for better caching
    keepPreviousData: true, // Keep previous data while loading new
  });

  const data = fullData
    ? applyMetricsContinuity(fullData, metricTypes)
    : undefined;

  return {
    data,
    error,
    isLoading,
  };
};
