// import { MetricData } from "@/shared/contexts";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { formatUnits } from "viem";

// interface TokenDistributionChartData {
//   TOTAL_SUPPLY: MetricData;
//   CIRCULATING_SUPPLY: MetricData;
//   DELEGATED_SUPPLY: MetricData;
//   CEX_SUPPLY: MetricData;
//   DEX_SUPPLY: MetricData;
//   LENDING_SUPPLY: MetricData;
//   TREASURY: MetricData;
//   PROPOSALS: MetricData;
//   ACTIVE_SUPPLY: MetricData;
//   VOTES: MetricData;
//   AVERAGE_TURNOUT: MetricData;
// }

export const calculateChangeRate = (
  data: DaoMetricsDayBucket[] = [],
): string | null => {
  if (data.length < 2) return null;

  const first = data[0].high;
  const last = data.at(-1)?.high;

  if (!first || !last || BigInt(first) === BigInt(0)) return "0";

  const change = (BigInt(last) * BigInt(1e18)) / BigInt(first) - BigInt(1e18);
  return formatUnits(change, 18);
};

// export const formatChartVariation = (
//   timeSeriesData: Record<MetricTypesEnum, DaoMetricsDayBucket[]>,
// ): TokenDistributionChartData => {
//   const metrics = Object.values(MetricTypesEnum);

//   const chartData = {} as TokenDistributionChartData;

//   metrics.forEach((metric) => {
//     chartData[metric] = {
//       value: timeSeriesData?.[metric]?.at(-1)?.high ?? null,
//       changeRate: calculateChangeRate(timeSeriesData?.[metric]),
//     };
//   });

//   return chartData;
// };
