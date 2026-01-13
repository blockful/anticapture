import { DaoIdEnum } from "@/shared/types/daos";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { useMultipleEnsData } from "@/shared/hooks/useEnsData";
import { Address, formatUnits } from "viem";
import { formatAddress } from "@/shared/utils/formatAddress";
import { useGetAccountInteractionsQuery } from "@anticapture/graphql-client/hooks";
import daoConfig from "@/shared/dao-config";
import {
  Query_AccountInteractions_Items_Items,
  QueryInput_AccountInteractions_OrderDirection,
} from "@anticapture/graphql-client";

interface Interaction {
  accountId: string;
  transferCount: string;
  totalVolume: string;
  amountTransferred: string;
  __typename?: Query_AccountInteractions_Items_Items["__typename"];
}

interface InteractionResponse {
  topFive: Array<Interaction>;
  interactions: Array<Interaction>;
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
}

export const useAccountInteractionsData = ({
  daoId,
  address,
  filterAddress,
  sortDirection,
  filterVariables,
  limit = 100,
}: {
  daoId: DaoIdEnum;
  address: string;
  filterAddress?: string;
  sortBy?: "transferCount" | "totalVolume";
  sortDirection?: "asc" | "desc";
  filterVariables?: {
    minAmount: string | null;
    maxAmount: string | null;
  };
  limit?: number;
}): InteractionResponse => {
  const { decimals } = daoConfig[daoId];

  const { data, loading, error } = useGetAccountInteractionsQuery({
    variables: {
      address,
      orderDirection:
        sortDirection as QueryInput_AccountInteractions_OrderDirection,
      minAmount: filterVariables?.minAmount,
      maxAmount: filterVariables?.maxAmount,
      limit,
      filterAddress,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  const interactionsData = data?.accountInteractions?.items;
  const totalCount = data?.accountInteractions?.totalCount || 0n;
  const topFive: Interaction[] =
    interactionsData && interactionsData?.length > 0
      ? interactionsData
          .slice(0, 5)
          .filter((item): item is Interaction => item !== null)
      : [];

  const interactionsAddresses: Address[] =
    topFive
      .filter((interaction) => interaction?.accountId)
      .map((interaction) => interaction?.accountId as Address) || [];

  const { data: ensData } = useMultipleEnsData(interactionsAddresses);

  const defaultData = {
    topFive: [],
    interactions: [],
    netBalanceChange: 0,
    totalIndividualInteractions: 0,
    loading,
    chartConfig: {},
    pieData: [],
    legendItems: [],
    totalCount: 0,
    totalTransfers: 0,
    error,
  };

  if (!topFive.length || totalCount === 0n) {
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

  const pieData: {
    name: string;
    label: string;
    value: number;
  }[] = [];

  const totalTransfers = interactionsData
    ? interactionsData.reduce((acc, item) => {
        return acc + Number(item?.transferCount || 0);
      }, 0)
    : 0;

  const topFiveTransfers = topFive.reduce((acc, item) => {
    return acc + Number(item?.transferCount || 0);
  }, 0);

  const othersValue = totalTransfers - topFiveTransfers;

  const othersPercentage =
    totalTransfers > 0 ? (othersValue / totalTransfers) * 100 : 0;

  topFive.forEach((interaction, index) => {
    if (!interaction?.accountId) {
      return;
    }

    const percentage =
      totalTransfers > 0
        ? (Number(interaction.transferCount || 0) / totalTransfers) * 100
        : 0;

    const ensName = ensData?.[interaction.accountId as Address]?.ens;
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

  if (othersValue > BigInt(0)) {
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

  const netBalanceChange = interactionsData?.reduce((acc, item) => {
    return (
      acc + Number(formatUnits(BigInt(item?.amountTransferred || 0), decimals))
    );
  }, 0);

  return {
    topFive,
    interactions:
      interactionsData?.filter((item): item is Interaction => item !== null) ||
      [],
    loading,
    chartConfig,
    netBalanceChange: netBalanceChange || 0,
    totalCount,
    totalTransfers,
    pieData,
    legendItems,
    totalIndividualInteractions,
    error,
  };
};
