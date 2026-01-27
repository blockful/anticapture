"use client";

import { useMultipleEnsData } from "@/shared/hooks/useEnsData";
import {
  useGetBatchAccountBalancesQuery,
  useGetBatchDelegatorCountsQuery,
} from "@anticapture/graphql-client/hooks";
import { Address, zeroAddress } from "viem";
import { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";
import { DaoIdEnum } from "@/shared/types/daos";
import { useMemo } from "react";

interface UseTopAccountsChartDataParams {
  chartData: TopAccountChartData[];
  daoId: DaoIdEnum;
}

export function useTopAccountsChartData({
  chartData,
  daoId,
}: UseTopAccountsChartDataParams) {
  const addresses = useMemo(
    () => chartData.map((item) => item.address as Address),
    [chartData],
  );

  const { data: balancesData } = useGetBatchAccountBalancesQuery({
    variables: {
      addresses: addresses,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: addresses.length === 0,
  });

  const delegateAddresses = useMemo(() => {
    if (!balancesData?.accountBalances?.items) return [];

    const delegates = balancesData.accountBalances.items
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item) => item.delegate)
      .filter(
        (delegate): delegate is string =>
          !!delegate && delegate !== zeroAddress,
      );

    return [...new Set(delegates)] as Address[];
  }, [balancesData]);

  const { data: delegatorCountsData } = useGetBatchDelegatorCountsQuery({
    variables: {
      delegates: delegateAddresses,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: delegateAddresses.length === 0,
  });

  const { data: ensData } = useMultipleEnsData([
    ...addresses,
    ...delegateAddresses,
  ]);

  const delegatorCounts = useMemo(() => {
    if (!delegatorCountsData?.accountBalances?.items) return {};

    const counts: Record<string, number> = {};

    delegatorCountsData.accountBalances.items
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .forEach((item) => {
        const delegate = item.delegate?.toLowerCase();
        if (delegate) {
          counts[delegate] = (counts[delegate] || 0) + 1;
        }
      });

    return counts;
  }, [delegatorCountsData]);

  const addressToDelegateMap = useMemo(() => {
    if (!balancesData?.accountBalances?.items) return {};

    const map: Record<string, string | undefined> = {};

    balancesData.accountBalances.items
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .forEach((item) => {
        const address = item.accountId.toLowerCase();
        map[address] = item.delegate || undefined;
      });

    return map;
  }, [balancesData]);

  const processedData = useMemo(() => {
    return chartData.map((item) => {
      const addressLower = item.address.toLowerCase();
      const delegateAddress = addressToDelegateMap[addressLower];

      const delegateAddressTyped =
        delegateAddress && delegateAddress !== zeroAddress
          ? (delegateAddress as Address)
          : undefined;

      return {
        ...item,
        name: ensData?.[item.address as Address]?.ens,
        latestDelegate: delegateAddressTyped
          ? ensData?.[delegateAddressTyped]?.ens || delegateAddressTyped
          : undefined,
        totalDelegators: delegatorCounts[addressLower] || 0,
      };
    });
  }, [chartData, addressToDelegateMap, ensData, delegatorCounts]);

  return {
    data: processedData,
    loading: false,
    error: null,
  };
}
