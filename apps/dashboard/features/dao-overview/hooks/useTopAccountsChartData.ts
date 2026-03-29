"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { zeroAddress } from "viem";

import type { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";
import { useMultipleEnsData } from "@/shared/hooks/useEnsData";
import type { DaoIdEnum } from "@/shared/types/daos";

interface UseTopAccountsChartDataParams {
  chartData: TopAccountChartData[];
  daoId: DaoIdEnum;
}

export const useTopAccountsChartData = ({
  chartData,
}: UseTopAccountsChartDataParams) => {
  const addresses = useMemo(
    () => chartData.map((item) => item.address as Address),
    [chartData],
  );

  const delegateAddresses = useMemo(() => {
    return chartData
      .map((item) => item.delegate as Address | undefined)
      .filter(
        (address): address is Address => !!address && address !== zeroAddress,
      );
  }, [chartData]);

  const { data: ensData } = useMultipleEnsData([
    ...addresses,
    ...delegateAddresses,
  ]);

  const processedData = useMemo(() => {
    return chartData.map((item) => {
      const delegateAddress =
        item.delegate && item.delegate !== zeroAddress
          ? (item.delegate as Address)
          : undefined;

      return {
        ...item,
        name: ensData?.[item.address as Address]?.ens,
        latestDelegate: delegateAddress
          ? ensData?.[delegateAddress]?.ens || delegateAddress
          : undefined,
        totalDelegators: item.delegationsCount ?? 0,
      };
    });
  }, [chartData, ensData]);

  return {
    data: processedData,
  };
};
