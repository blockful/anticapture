import useSWR from "swr";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import axios from "axios";

const fetchTimeSeries = async (
  daoId: DaoIdEnum,
  days: TimeInterval,
  metricTypes: MetricTypesEnum[],
): Promise<Record<MetricTypesEnum, DaoMetricsDayBucket[]>> => {
  const fromDate = String(
    Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days],
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
        limit: 365
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
 * Fill the gaps on the dailyMetricBuckets using the previous day's values
 */
const applyMetricsContinuity = (
  data: Record<MetricTypesEnum, DaoMetricsDayBucket[]> | undefined,
  metricTypes: MetricTypesEnum[],
): Record<MetricTypesEnum, DaoMetricsDayBucket[]> | undefined => {
  if (!data) return undefined;

  const metricsWithContinuity: Record<MetricTypesEnum, DaoMetricsDayBucket[]> =
    {} as Record<MetricTypesEnum, DaoMetricsDayBucket[]>;

  const allDates = new Set<string>();
  for (const metricType of metricTypes) {
    if (data[metricType]) {
      data[metricType].forEach((item) => {
        allDates.add(item.date);
      });
    }
  }

  const sortedDates = Array.from(allDates).sort(
    (a, b) => Number(a) - Number(b),
  );

  for (const metricType of metricTypes) {
    metricsWithContinuity[metricType] = [];

    if (data[metricType] && data[metricType].length > 0) {
      let lastKnownEntry: DaoMetricsDayBucket | null = null;

      for (const date of sortedDates) {
        const entry = data[metricType].find((item) => item.date === date);

        if (entry) {
          metricsWithContinuity[metricType].push(entry);
          lastKnownEntry = entry;
        } else if (lastKnownEntry) {
          metricsWithContinuity[metricType].push({
            ...lastKnownEntry,
            date: date,
          });
        }
      }
    }
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
  const stableMetricTypes = metricTypes.sort(); // Stable sort for consistent cache key

  const {
    data: fullData,
    error,
    isLoading,
  } = useSWR(
    [`timeSeriesData-bulk`, daoId, days, stableMetricTypes.join(",")],
    () => fetchTimeSeries(daoId, days, stableMetricTypes),
    {
      refreshInterval: options?.refreshInterval ?? 0,
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
      revalidateOnMount: true,
      revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
      revalidateIfStale: true,
      dedupingInterval: 5000, // Increased for better caching
      keepPreviousData: true, // Keep previous data while loading new
    },
  );

  const data = fullData
    ? applyMetricsContinuity(fullData, metricTypes)
    : undefined;

  return {
    data,
    error,
    isLoading,
  };
};
