import { MetricTypesEnum } from "@/lib/client/constants";
import { DaoMetricsDayBucket } from "@/lib/server/backend";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";

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
  console.log("data", data);

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
