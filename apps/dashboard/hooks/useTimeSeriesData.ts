import { MetricTypesEnum } from "@/lib/client/constants";
import { DaoMetricsDayBucket } from "@/lib/dao-config/types";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR from "swr";

export const fetchTimeSeriesDataFromGraphQL = async (
  daoId: DaoIdEnum,
  metricTypes: MetricTypesEnum[],
  days: number,
): Promise<Record<MetricTypesEnum, DaoMetricsDayBucket[]>> => {
  const dateFilter = String(BigInt(Date.now() - days * 86400000)).slice(0, 10);

  // Build a query that fetches all metric types in a single request
  const whereConditions = metricTypes
    .map(
      (metricType) => `
      ${metricType}: daoMetricsDayBucketss(
        where: {
          metricType: ${metricType},
          date_gte: "${dateFilter}",
          daoId: "${daoId}"
        },
        orderBy: "date",
        orderDirection: "asc",
        limit: ${days}
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
        }
      }
    `,
    )
    .join("\n");

  const response = await fetch(`${BACKEND_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
          query DaoMetricsDayBuckets {
            ${whereConditions}
          }
        `,
    }),
  });

  const data = await response.json();

  // Process the results for each metric type
  const results: Record<MetricTypesEnum, DaoMetricsDayBucket[]> = {} as Record<
    MetricTypesEnum,
    DaoMetricsDayBucket[]
  >;

  for (const metricType of metricTypes) {
    if (data?.data?.[metricType]?.items) {
      results[metricType] = data.data[metricType]
        .items as DaoMetricsDayBucket[];
    } else {
      results[metricType] = [];
    }
  }

  return results;
};

/**
 * SWR hook for fetching time series data for multiple metrics
 * @param daoId The DAO ID to fetch data for
 * @param metricTypes Array of metric types to fetch
 * @param days Number of days of data to fetch
 * @param options Additional SWR options
 */
export const useTimeSeriesData = (
  daoId: DaoIdEnum,
  metricTypes: MetricTypesEnum[],
  days: number,
  options?: {
    refreshInterval?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  },
) => {
  const fetcher = () =>
    fetchTimeSeriesDataFromGraphQL(daoId, metricTypes, days);

  // Create a unique key for this data request
  const swrKey =
    daoId && metricTypes.length > 0 && days > 0
      ? [`timeSeriesData`, daoId, metricTypes.join(","), days]
      : null;

  return useSWR(swrKey, fetcher, {
    refreshInterval: options?.refreshInterval || 0, // Default to no auto-refresh
    revalidateOnFocus: options?.revalidateOnFocus ?? false, // Default to false
    revalidateOnReconnect: options?.revalidateOnReconnect ?? true,
    dedupingInterval: 10000, // Dedupe identical requests within 10 seconds
  });
};
