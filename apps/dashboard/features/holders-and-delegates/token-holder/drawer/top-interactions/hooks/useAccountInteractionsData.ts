import {
  getNextPageParam,
  type AccountInteraction,
  type AccountInteractionsPathParamsDaoEnumKey,
} from "@anticapture/client";
import {
  useGetAddresses,
  useAccountInteractionsInfinite,
} from "@anticapture/client/hooks";
import { useMemo } from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";

import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatAddress } from "@/shared/utils/formatAddress";

interface InteractionResponse {
  topFive: Array<AccountInteraction>;
  interactions: Array<AccountInteraction>;
  netBalanceChange: number;
  loading: boolean;
  chartConfig: Record<
    string,
    {
      label: string;
      value: number;
      color: string;
      percentage: string;
      ensName?: string;
    }
  >;
  pieData: {
    name: string;
    label: string;
    value: number;
  }[];
  legendItems: { color: string; label: string; percentage: string }[];
  totalIndividualInteractions: number;
  totalCount: number;
  totalTransfers: number;
  error?: Error;
  fetchNextPage: () => Promise<unknown>;
  fetchingMore: boolean;
  hasNextPage: boolean;
}
export const useAccountInteractionsData = ({
  daoId,
  address,
  filterAddress,
  sortBy,
  sortDirection,
  filterVariables,
  limit = 100,
}: {
  daoId: DaoIdEnum;
  address: string;
  filterAddress?: string;
  sortBy?: "count" | "volume";
  sortDirection?: "asc" | "desc";
  filterVariables?: {
    minAmount: string | null;
    maxAmount: string | null;
  };
  limit?: number;
}): InteractionResponse => {
  const { decimals } = daoConfig[daoId];

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAccountInteractionsInfinite(
    daoId.toLowerCase() as AccountInteractionsPathParamsDaoEnumKey,
    address,
    {
      orderBy: sortBy,
      orderDirection: sortDirection,
      minAmount: filterVariables?.minAmount ?? undefined,
      maxAmount: filterVariables?.maxAmount ?? undefined,
      limit,
      filterAddress: filterAddress ?? undefined,
    },
    { query: { getNextPageParam } },
  );

  const interactionsData = useMemo(() => {
    const seen = new Set<string>();
    return (
      data?.pages
        .flatMap((p) => p.items)
        .filter((item) => {
          if (!item.accountId || seen.has(item.accountId)) return false;
          seen.add(item.accountId);
          return true;
        }) ?? []
    );
  }, [data]);
  const totalCount = data?.pages[data.pages.length - 1]?.totalCount ?? 0;
  const computedHasNextPage = hasNextPage ?? false;

  const topFive =
    interactionsData.length > 0 ? interactionsData.slice(0, 5) : [];

  const interactionsAddresses: Address[] = topFive
    .filter((interaction) => interaction?.accountId)
    .map((interaction) => interaction.accountId as Address);

  const { data: enrichmentData } = useGetAddresses(
    { addresses: interactionsAddresses },
    { query: { enabled: interactionsAddresses.length > 0 } },
  );

  const ensNameByAddress = useMemo(() => {
    const map: Record<string, string | null | undefined> = {};
    enrichmentData?.results?.forEach((result) => {
      map[result.address.toLowerCase()] = result.ens?.name;
    });
    return map;
  }, [enrichmentData]);

  const defaultData: InteractionResponse = {
    topFive: [],
    interactions: [],
    netBalanceChange: 0,
    totalIndividualInteractions: 0,
    loading: isLoading,
    chartConfig: {},
    pieData: [],
    legendItems: [],
    totalCount: 0,
    totalTransfers: 0,
    error: error as Error | undefined,
    fetchNextPage,
    fetchingMore: isFetchingNextPage,
    hasNextPage: computedHasNextPage,
  };

  if (!topFive.length || totalCount === 0) {
    return defaultData;
  }

  const totalIndividualInteractions = topFive.reduce((acc, item) => {
    return acc + Number(item?.transferCount);
  }, 0);

  const chartConfig: Record<
    string,
    {
      label: string;
      color: string;
      value: number;
      percentage: string;
      ensName?: string;
    }
  > = {};

  const pieData: { name: string; label: string; value: number }[] = [];

  const totalTransfers = interactionsData.reduce((acc, item) => {
    return acc + Number(item?.transferCount || 0);
  }, 0);

  const topFiveTransfers = topFive.reduce((acc, item) => {
    return acc + Number(item?.transferCount || 0);
  }, 0);

  const othersValue = totalTransfers - topFiveTransfers;
  const othersPercentage =
    totalTransfers > 0 ? (othersValue / totalTransfers) * 100 : 0;

  topFive.forEach((interaction, index) => {
    if (!interaction?.accountId) return;

    const percentage =
      totalTransfers > 0
        ? (Number(interaction.transferCount || 0) / totalTransfers) * 100
        : 0;

    const ensName =
      ensNameByAddress[(interaction.accountId as Address).toLowerCase()] ??
      undefined;
    const displayLabel = ensName || formatAddress(interaction.accountId) || "";

    chartConfig[interaction.accountId || `interaction-${index}`] = {
      label: displayLabel,
      value: Number(interaction.transferCount || 0),
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      percentage: percentage.toFixed(2),
      ensName,
    };

    pieData.push({
      name: interaction.accountId || "",
      label: displayLabel,
      value: Number(interaction.transferCount || 0),
    });
  });

  if (othersValue > 0) {
    chartConfig["others"] = {
      label: "Others",
      color: "#9CA3AF",
      value: othersValue,
      percentage: othersPercentage.toFixed(2),
    };

    pieData.push({
      name: "others",
      label: "Others",
      value: othersValue,
    });
  }

  const legendItems = Object.entries(chartConfig).map(
    ([, config]: [
      string,
      { color: string; label: string; percentage: string; ensName?: string },
    ]) => ({
      color: config.color,
      label: config.label,
      percentage: config.percentage,
    }),
  );

  const netBalanceChange = interactionsData.reduce((acc, item) => {
    return (
      acc + Number(formatUnits(BigInt(item?.amountTransferred || 0), decimals))
    );
  }, 0);

  return {
    topFive,
    interactions: interactionsData,
    loading: isLoading,
    chartConfig,
    netBalanceChange,
    totalCount,
    totalTransfers,
    pieData,
    legendItems,
    totalIndividualInteractions,
    error: error as Error | undefined,
    fetchNextPage,
    fetchingMore: isFetchingNextPage,
    hasNextPage: computedHasNextPage,
  };
};
