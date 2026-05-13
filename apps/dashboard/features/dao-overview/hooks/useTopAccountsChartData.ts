"use client";

import { zeroAddress, type Address } from "viem";

import { useGetAddresses } from "@anticapture/client/hooks";

import type { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";

interface UseTopAccountsChartDataParams {
  chartData: TopAccountChartData[];
}

export function useTopAccountsChartData({
  chartData,
}: UseTopAccountsChartDataParams) {
  const addresses = chartData.map((item) => item.address);

  const delegateAddresses = chartData
    .map((item) => item.delegate)
    .filter(
      (address): address is Address => !!address && address !== zeroAddress,
    );

  const lookupAddresses = Array.from(
    new Set([...addresses, ...delegateAddresses]),
  );

  const { data } = useGetAddresses(
    { addresses: lookupAddresses },
    { query: { enabled: lookupAddresses.length > 0 } },
  );

  const ensNameByAddress: Record<string, string | null | undefined> = {};
  data?.results?.forEach((result) => {
    ensNameByAddress[result.address.toLowerCase()] = result.ens?.name;
  });

  const lookupEnsName = (address: string | undefined) =>
    address ? ensNameByAddress[address.toLowerCase()] : undefined;

  const processedData = chartData.map((item) => {
    return {
      ...item,
      name: lookupEnsName(item.address),
      latestDelegate:
        item.delegate && item.delegate !== zeroAddress
          ? lookupEnsName(item.delegate) || item.delegate
          : undefined,
      totalDelegators: item.delegationsCount ?? 0,
    };
  });

  return {
    data: processedData,
  };
}
