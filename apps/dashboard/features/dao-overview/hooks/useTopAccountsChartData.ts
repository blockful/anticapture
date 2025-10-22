"use client";

import { useMultipleEnsData } from "@/shared/hooks/useEnsData";
import { Address } from "viem";
import { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";

export function useTopAccountsChartData(chartData: TopAccountChartData[]) {
  const { data: ensData } = useMultipleEnsData(
    chartData.map((item) => item.address as Address),
  );

  return chartData.map((item) => ({
    ...item,
    name: ensData?.[item.address as Address]?.ens || item.address,
  }));
}
