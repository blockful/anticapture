import useSWR from "swr";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import {
  DAYS_IN_SECONDS,
  TIME_INTERVAL_TO_DAYS,
} from "@/shared/constants/time-related";

const fetchTimeSeriesDataFromGraphQL = async (
  daoId: DaoIdEnum,
  metricTypes: MetricTypesEnum[],
): Promise<Record<MetricTypesEnum, DaoMetricsDayBucket[]>> => {
  const oneYearAgo = String(
    BigInt(
      Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[TimeInterval.ONE_YEAR],
    ),
  ).slice(0, 10);

  const whereConditions = metricTypes
    .map(
      (metricType) => `
      ${metricType}: daoMetricsDayBuckets(
        where: {
          metricType: ${metricType},
          date_gte: "${oneYearAgo}",
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

  const response = await fetch(`${BACKEND_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query DaoMetricsDayBuckets { ${whereConditions} }`,
    }),
  });

  const data = await response.json();
  const metricsByType: Record<MetricTypesEnum, DaoMetricsDayBucket[]> =
    {} as Record<MetricTypesEnum, DaoMetricsDayBucket[]>;

  for (const metricType of metricTypes) {
    metricsByType[metricType] = data?.data?.[metricType]?.items || [];
  }

  return metricsByType;
};

/**
 * Filters metric data for a specific time period
 * Returns metrics filtered by the selected period
 */
const filterMetricsByPeriod = (
  data: Record<MetricTypesEnum, DaoMetricsDayBucket[]> | undefined,
  metricTypes: MetricTypesEnum[],
  days: TimeInterval,
): Record<MetricTypesEnum, DaoMetricsDayBucket[]> | undefined => {
  if (!data) return undefined;

  const filteredMetricsByPeriod: Record<
    MetricTypesEnum,
    DaoMetricsDayBucket[]
  > = {} as Record<MetricTypesEnum, DaoMetricsDayBucket[]>;

  // Use seconds consistently to avoid ms/s mismatches that can
  // collapse the chart around midnight in certain timezones
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const cutoffTimestampSeconds = nowInSeconds - DAYS_IN_SECONDS[days];
  const cutoffDate = cutoffTimestampSeconds.toString();

  for (const metricType of metricTypes) {
    if (
      !data[metricType] ||
      !Array.isArray(data[metricType]) ||
      data[metricType].length === 0
    ) {
      filteredMetricsByPeriod[metricType] = [];
      continue;
    }

    const sortedData = [...data[metricType]].sort(
      (a, b) => Number(a.date) - Number(b.date),
    );

    const filteredData = sortedData.filter(
      (item) => Number(item.date) >= Number(cutoffDate),
    );

    if (filteredData.length === 0) {
      const numDays = TIME_INTERVAL_TO_DAYS[days];
      filteredMetricsByPeriod[metricType] = sortedData.slice(
        -Math.min(numDays, sortedData.length),
      );
    } else {
      filteredMetricsByPeriod[metricType] = filteredData;
    }
  }

  return filteredMetricsByPeriod;
};

/**
 * Applies continuity to metrics by filling gaps with last known values
 * Returns metrics with continuous data points
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

const processData = (
  fullData: Record<MetricTypesEnum, DaoMetricsDayBucket[]> | undefined,
  metricTypes: MetricTypesEnum[],
  days: TimeInterval,
): Record<MetricTypesEnum, DaoMetricsDayBucket[]> | undefined => {
  if (!fullData) return undefined;

  const filteredData = filterMetricsByPeriod(fullData, metricTypes, days);

  return filteredData
    ? applyMetricsContinuity(filteredData, metricTypes)
    : undefined;
};

/**
 * Hook for fetching individual metric data with better caching
 */
export const useIndividualMetricData = (
  daoId: DaoIdEnum,
  metricType: MetricTypesEnum,
  options?: {
    refreshInterval?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  },
) => {
  const fetchKey = daoId ? [`timeSeriesData`, daoId, metricType] : null;

  return useSWR(
    fetchKey,
    async () => {
      const oneYearAgo = String(
        BigInt(
          Math.floor(Date.now() / 1000) -
            DAYS_IN_SECONDS[TimeInterval.ONE_YEAR],
        ),
      ).slice(0, 10);

      const response = await fetch(`${BACKEND_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query DaoMetricsDayBuckets {
            ${metricType}: daoMetricsDayBuckets(
              where: {
                metricType: ${metricType},
                date_gte: "${oneYearAgo}",
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
          }`,
        }),
      });

      const data = await response.json();
      return data?.data?.[metricType]?.items || [];
    },
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
  const fetchKey =
    daoId && stableMetricTypes.length > 0
      ? [`timeSeriesData-bulk`, daoId, stableMetricTypes.join(",")]
      : null;

  const {
    data: fullData,
    error,
    isLoading,
  } = useSWR(
    fetchKey,
    () => fetchTimeSeriesDataFromGraphQL(daoId, stableMetricTypes),
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

  const processedData = fullData
    ? processData(fullData, stableMetricTypes, days)
    : undefined;

  return {
    data: processedData,
    error,
    isLoading,
  };
};
