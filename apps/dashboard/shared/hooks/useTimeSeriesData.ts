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
        limit: 370
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

  // Find min and max dates across all metrics
  let minDate = Infinity;
  let maxDate = -Infinity;

  for (const metricType of metricTypes) {
    if (data[metricType]) {
      data[metricType].forEach((item) => {
        const timestamp = Number(item.date);
        minDate = Math.min(minDate, timestamp);
        maxDate = Math.max(maxDate, timestamp);
      });
    }
  }

  if (minDate === Infinity) return metricsWithContinuity;

  // Align current time to day boundary and include it
  const DAY_IN_SECONDS = 86400;
  const now = Math.floor(Date.now() / 1000);
  const todayAligned = Math.floor(now / DAY_IN_SECONDS) * DAY_IN_SECONDS;
  maxDate = Math.max(maxDate, todayAligned);

  // Generate ALL dates between min and max (assuming daily buckets)
  const allDates: number[] = [];
  for (let d = minDate; d <= maxDate; d += DAY_IN_SECONDS) {
    allDates.push(d);
  }

  for (const metricType of metricTypes) {
    metricsWithContinuity[metricType] = [];

    if (data[metricType] && data[metricType].length > 0) {
      // Create a map for O(1) lookups - normalize to numbers
      const dataMap = new Map(
        data[metricType].map((item) => [Number(item.date), item]),
      );

      let lastKnownEntry: DaoMetricsDayBucket | null = null;

      for (const date of allDates) {
        const entry = dataMap.get(date);

        if (entry) {
          metricsWithContinuity[metricType].push(entry);
          lastKnownEntry = entry;
        } else if (lastKnownEntry) {
          metricsWithContinuity[metricType].push({
            ...lastKnownEntry,
            date: date.toString(), // or date, depending on your type
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
