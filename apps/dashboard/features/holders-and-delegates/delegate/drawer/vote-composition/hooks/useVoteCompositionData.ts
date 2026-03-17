import {
  QueryInput_Delegators_OrderBy,
  QueryInput_Delegators_OrderDirection,
} from "@anticapture/graphql-client";
import {
  useAccountBalanceByAddressQuery,
  useGetVotingPowerQuery,
} from "@anticapture/graphql-client/hooks";
import type { Address } from "viem";
import { formatUnits } from "viem";

import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import daoConfig from "@/shared/dao-config";
import type { DelegatorItem } from "@/shared/hooks/graphql-client/useDelegators";
import { useDelegators } from "@/shared/hooks/graphql-client/useDelegators";
import { useMultipleEnsData } from "@/shared/hooks/useEnsData";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatAddress } from "@/shared/utils/formatAddress";
import { getAuthHeaders } from "@/shared/utils/server-utils";

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
  includeBalance = true,
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
        ...getAuthHeaders(),
      },
    },
    variables: {
      address,
    },
  });

  const isAave = daoId === DaoIdEnum.AAVE;

  const { data: balanceData } = useAccountBalanceByAddressQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
    variables: {
      address,
    },
    skip: !isAave,
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

  const selfBalance =
    isAave && includeBalance
      ? BigInt(balanceData?.accountBalanceByAccountId?.data?.balance ?? "0")
      : 0n;

  if (delegators.length === 0 && selfBalance === 0n) {
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

  // For AAVE, an address can hold tokens without activating voting power
  // (requires self-delegation). Fall back to selfBalance + delegators as total.
  const effectiveTotal =
    delegateCurrentVotingPower > 0n
      ? delegateCurrentVotingPower
      : selfBalance + totalIndividualDelegators;

  // Others is the remaining value that completes 100%
  // This will be > 0 when there are more than 5 delegators
  // For AAVE, own balance is shown separately, so subtract it from others
  const othersValue =
    delegateCurrentVotingPower - selfBalance - totalIndividualDelegators;
  const othersPercentage = Number(
    (Number(othersValue) / Number(effectiveTotal)) * 100,
  );

  const chartConfig: Record<
    string,
    { label: string; color: string; percentage: string; ensName?: string }
  > = {};

  const pieData: { name: string; label: string; value: number }[] = [];

  // For AAVE, add the delegate's own balance as the first slice
  if (isAave && selfBalance > 0n) {
    const selfPercentage = Number(
      (Number(selfBalance) / Number(effectiveTotal)) * 100,
    );
    const selfPercentageStr =
      selfPercentage > 0 && selfPercentage < 0.01
        ? "<0.01"
        : selfPercentage.toFixed(2);
    chartConfig["self"] = {
      label: "Self",
      color: PIE_CHART_COLORS[0],
      percentage: selfPercentageStr,
    };
    pieData.push({
      name: "self",
      label: "Self",
      value: Number(formatUnits(selfBalance, decimals)),
    });
  }

  const delegatorColorOffset = isAave && selfBalance > 0n ? 1 : 0;

  delegators.forEach((delegator, index) => {
    const amount = BigInt(delegator.amount);
    if (amount === 0n) return;

    const percentage = Number((Number(amount) / Number(effectiveTotal)) * 100);
    const percentageStr =
      percentage > 0 && percentage < 0.01 ? "<0.01" : percentage.toFixed(2);

    const ensName = ensData?.[delegator.delegatorAddress as Address]?.ens;
    const displayLabel =
      ensName || formatAddress(delegator.delegatorAddress) || "";

    chartConfig[delegator.delegatorAddress || `delegator-${index}`] = {
      label: displayLabel,
      color:
        PIE_CHART_COLORS[
          (index + delegatorColorOffset) % PIE_CHART_COLORS.length
        ],
      percentage: percentageStr,
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
    currentVotingPower: Number(formatUnits(effectiveTotal, decimals)),
    loading,
    chartConfig,
    pieData,
    legendItems,
    totalIndividualDelegators,
    othersValue,
    othersPercentage,
  };
};
