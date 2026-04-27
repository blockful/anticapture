"use client";

import type { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";
import { useMultipleEnsData } from "@/shared/hooks/useEnsData";

interface UseTopAccountsChartDataParams {
  chartData: TopAccountChartData[];
}

export function useTopAccountsChartData({
  chartData,
}: UseTopAccountsChartDataParams) {
  const addresses = chartData.map((item) => item.address);

  const delegateAddresses = chartData
    .map((item) => item.delegate)
    .filter((address) => !!address);

  const { data: ensData } = useMultipleEnsData([
    ...addresses,
    ...delegateAddresses,
  ]);

  const processedData = chartData.map((item) => {
    return {
      ...item,
      name: ensData[item.address]?.ens,
      latestDelegate: item.delegate
        ? ensData[item.delegate]?.ens || item.delegate
        : undefined,
      totalDelegators: item.delegationsCount ?? 0,
    };
  });

  return {
    data: processedData,
  };
}
