import {
  useDelegators,
  DelegatorItem,
} from "@/shared/hooks/graphql-client/useDelegators";
import {
  QueryInput_Delegators_OrderBy,
  QueryInput_Delegators_OrderDirection,
} from "@anticapture/graphql-client";
import { DaoIdEnum } from "@/shared/types/daos";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { useMultipleEnsData } from "@/shared/hooks/useEnsData";
import { Address, formatUnits } from "viem";
import { formatAddress } from "@/shared/utils/formatAddress";
import daoConfig from "@/shared/dao-config";
import { useGetVotingPowerQuery } from "@anticapture/graphql-client/hooks";

export interface VoteCompositionData {
  topDelegators: DelegatorItem[];
  currentVotingPower: number;
  loading: boolean;

  chartConfig: Record<
    string,
    { label: string; color: string; percentage: string; ensName?: string }
  >;
  pieData: { name: string; value: number }[];
  legendItems: { color: string; label: string; percentage: string }[];

  totalIndividualDelegators: bigint;
  othersValue: bigint;
  othersPercentage: number;
}

export const useVoteCompositionData = (
  daoId: DaoIdEnum,
  address: string,
): VoteCompositionData => {
  const { decimals } = daoConfig[daoId];

  const { delegators, loading } = useDelegators({
    daoId,
    address,
    orderBy: QueryInput_Delegators_OrderBy.Amount,
    orderDirection: QueryInput_Delegators_OrderDirection.Desc,
    limit: 5,
  });

  const { data: votingPowerData } = useGetVotingPowerQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      address,
    },
  });

  const delegatorAddresses: Address[] = delegators.map(
    (delegator) => delegator.delegatorAddress as Address,
  );

  const { data: ensData } = useMultipleEnsData(delegatorAddresses);

  const defaultData: VoteCompositionData = {
    topDelegators: [],
    currentVotingPower: 0,
    loading,
    chartConfig: {},
    pieData: [],
    legendItems: [],
    totalIndividualDelegators: BigInt(0),
    othersValue: BigInt(0),
    othersPercentage: 0,
  };

  if (delegators.length === 0) {
    return defaultData;
  }

  const delegateCurrentVotingPower = BigInt(
    votingPowerData?.votingPowerByAccountId?.votingPower ?? "0",
  );

  const totalIndividualDelegators = delegators.reduce((acc, item) => {
    const amount = BigInt(item.amount);
    if (amount === 0n) return acc;
    return acc + amount;
  }, BigInt(0));

  // Others is the remaining value that completes 100%
  // This will be > 0 when there are more than 5 delegators
  const othersValue = delegateCurrentVotingPower - totalIndividualDelegators;
  const othersPercentage = Number(
    (Number(othersValue) / Number(delegateCurrentVotingPower)) * 100,
  );

  const chartConfig: Record<
    string,
    { label: string; color: string; percentage: string; ensName?: string }
  > = {};

  const pieData: { name: string; label: string; value: number }[] = [];

  delegators.forEach((delegator, index) => {
    const amount = BigInt(delegator.amount);
    if (amount === 0n) return;

    const percentage = Number(
      (Number(amount) / Number(delegateCurrentVotingPower)) * 100,
    );

    const ensName = ensData?.[delegator.delegatorAddress as Address]?.ens;
    const displayLabel =
      ensName || formatAddress(delegator.delegatorAddress) || "";

    chartConfig[delegator.delegatorAddress || `delegator-${index}`] = {
      label: displayLabel,
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      percentage: percentage.toFixed(2),
      ensName,
    };

    pieData.push({
      name: delegator.delegatorAddress || "",
      label: displayLabel,
      value: Number(formatUnits(amount, decimals)),
    });
  });

  if (othersValue > BigInt(0)) {
    chartConfig["others"] = {
      label: "Others",
      color: "#9CA3AF",
      percentage: othersPercentage.toFixed(2),
    };

    pieData.push({
      name: "others",
      label: "Others",
      value: Number(formatUnits(othersValue, decimals)),
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

  return {
    topDelegators: delegators,
    currentVotingPower: Number(
      formatUnits(BigInt(delegateCurrentVotingPower), decimals),
    ),
    loading,
    chartConfig,
    pieData,
    legendItems,
    totalIndividualDelegators,
    othersValue,
    othersPercentage,
  };
};
