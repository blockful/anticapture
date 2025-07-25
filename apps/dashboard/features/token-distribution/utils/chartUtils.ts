import { MetricData } from "@/shared/contexts";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { formatUnits } from "viem";

interface TokenDistributionChartData {
  totalSupply: MetricData;
  totalSupplyChart: DaoMetricsDayBucket[];
  circulatingSupply: MetricData;
  circulatingSupplyChart: DaoMetricsDayBucket[];
  delegatedSupply: MetricData;
  delegatedSupplyChart: DaoMetricsDayBucket[];
  cexSupply: MetricData;
  cexSupplyChart: DaoMetricsDayBucket[];
  dexSupply: MetricData;
  dexSupplyChart: DaoMetricsDayBucket[];
  lendingSupply: MetricData;
  lendingSupplyChart: DaoMetricsDayBucket[];
}

export const calculateChangeRate = (
  data: DaoMetricsDayBucket[] = [],
): string | null => {
  if (!data || data.length < 2) return null;

  try {
    if (data.length > 0) {
      const oldHigh = data[0].high ?? "0";
      const currentHigh = data[data.length - 1]?.high ?? "0";
      if (currentHigh === "0") {
        return "0";
      } else {
        return formatUnits(
          (BigInt(currentHigh) * BigInt(1e18)) / BigInt(oldHigh) - BigInt(1e18),
          18,
        );
      }
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const formatChartData = (
  timeSeriesData: Record<MetricTypesEnum, DaoMetricsDayBucket[]>,
) => {
  const chartData: TokenDistributionChartData = {
    totalSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY],
      ),
    },
    totalSupplyChart: timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY] || [],
    circulatingSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY]?.at(-1)?.high ??
        null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY],
      ),
    },
    circulatingSupplyChart:
      timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY] || [],
    delegatedSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY]?.at(-1)?.high ??
        null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY],
      ),
    },
    delegatedSupplyChart:
      timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY] || [],
    cexSupply: {
      value: timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY],
      ),
    },
    cexSupplyChart: timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY] || [],
    dexSupply: {
      value: timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY],
      ),
    },
    dexSupplyChart: timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY] || [],
    lendingSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY],
      ),
    },
    lendingSupplyChart: timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY] || [],
  };

  return chartData;
};
