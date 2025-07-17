import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { DaoIdEnum } from "@/shared/types/daos";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { useMultipleEnsData } from "@/shared/hooks/useEnsData";
import { Address } from "viem";
import { formatAddress } from "@/shared/utils/formatAddress";

export interface VotingPowerData {
  // Dados básicos
  topFiveDelegators: any[];
  currentVotingPower: number;
  loading: boolean;

  // Dados calculados
  chartConfig: Record<
    string,
    { label: string; color: string; percentage: string; ensName?: string }
  >;
  pieData: { name: string; value: number }[];
  legendItems: { color: string; label: string; percentage: string }[];

  // Valores calculados
  totalIndividualDelegators: bigint;
  othersValue: bigint;
  othersPercentage: number;
}

/**
 * Hook to get the voting power data for a delegate and pass to VotingPower component and ThePieChart component
 * @param daoId - The ID of the DAO
 * @param address - The address of the delegate
 * @returns The voting power data
 */
export const useVotingPowerData = (
  daoId: DaoIdEnum,
  address: string,
): VotingPowerData => {
  const { topFiveDelegators, delegatorsVotingPowerDetails, loading } =
    useVotingPower({
      daoId,
      address,
    });

  // Extract addresses for ENS lookup
  const delegatorAddresses: Address[] =
    topFiveDelegators
      ?.filter((delegator) => delegator.accountId && delegator.rawBalance > 0n)
      .map((delegator) => delegator.accountId as Address) || [];

  // Fetch ENS data for all delegators
  const { data: ensData } = useMultipleEnsData(delegatorAddresses);

  // default Value when there is no data
  const defaultData: VotingPowerData = {
    topFiveDelegators: [],
    currentVotingPower: 0,
    loading,
    chartConfig: {},
    pieData: [],
    legendItems: [],
    totalIndividualDelegators: BigInt(0),
    othersValue: BigInt(0),
    othersPercentage: 0,
  };

  // return default data when there is no valid data
  if (
    !topFiveDelegators ||
    topFiveDelegators.length === 0 ||
    !delegatorsVotingPowerDetails ||
    !delegatorsVotingPowerDetails.accountPower ||
    !delegatorsVotingPowerDetails.accountPower.votingPower
  ) {
    return defaultData;
  }

  const delegateCurrentVotingPower = BigInt(
    delegatorsVotingPowerDetails?.accountPower?.votingPower,
  );

  const currentVotingPowerNumber = Number(
    BigInt(delegateCurrentVotingPower) / BigInt(10 ** 18),
  );

  // Calculate the total value of the delegators that will be shown individually (>= 1%)
  const totalIndividualDelegators = topFiveDelegators.reduce((acc, item) => {
    if (item.rawBalance === 0n) return acc;

    const percentage = Number(
      (Number(BigInt(item.rawBalance)) / Number(delegateCurrentVotingPower)) *
        100,
    );

    // Sum only delegators with >= 1%
    if (percentage >= 1) {
      return acc + BigInt(item.rawBalance);
    }
    return acc;
  }, BigInt(0));

  // Others is the remaining value that completes 100%
  const othersValue = delegateCurrentVotingPower - totalIndividualDelegators;
  const othersPercentage = Number(
    (Number(othersValue) / Number(delegateCurrentVotingPower)) * 100,
  );

  // Create chart config (only those with >= 1%)
  const chartConfig: Record<
    string,
    { label: string; color: string; percentage: string; ensName?: string }
  > = {};

  // Add delegators to config (only those with >= 1%)
  topFiveDelegators.forEach((delegator, index) => {
    const key = delegator.accountId || `delegator-${index}`;

    if (delegator.rawBalance === 0n) return;

    const percentage = Number(
      (Number(BigInt(delegator.rawBalance)) /
        Number(delegateCurrentVotingPower)) *
        100,
    );

    // Only add delegators with >= 1% to individual config
    if (percentage >= 1) {
      const ensName = ensData?.[delegator.accountId as Address]?.ens;
      const displayLabel = ensName || formatAddress(delegator.accountId) || "";

      chartConfig[key] = {
        label: displayLabel,
        color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
        percentage: percentage.toFixed(2),
        ensName,
      };
    }
  });

  // Add Others if there's remaining voting power
  if (othersValue > BigInt(0)) {
    chartConfig["others"] = {
      label: "Others",
      color: "#9CA3AF", // Gray color for Others
      percentage: othersPercentage.toFixed(2),
    };
  }

  // Create pie data
  const pieData: { name: string; value: number }[] = [];

  // Add delegators with >= 1%
  topFiveDelegators.forEach((item) => {
    if (item.rawBalance === 0n) return;

    const percentage = Number(
      (Number(BigInt(item.rawBalance)) / Number(delegateCurrentVotingPower)) *
        100,
    );

    if (percentage >= 1) {
      pieData.push({
        name: item.accountId || "",
        value: Number(BigInt(item.rawBalance) / BigInt(10 ** 18)),
      });
    }
  });

  // Add "Others" slice to pie chart if there's remaining voting power
  if (othersValue > BigInt(0)) {
    pieData.push({
      name: "others",
      value: Number(othersValue / BigInt(10 ** 18)),
    });
  }

  // Create legend items from chartConfig
  const legendItems = Object.entries(chartConfig).map(
    ([key, config]: [
      string,
      { color: string; label: string; percentage: string; ensName?: string },
    ]) => ({
      color: config.color,
      label: config.label,
      percentage: config.percentage,
    }),
  );

  return {
    topFiveDelegators,
    currentVotingPower: currentVotingPowerNumber,
    loading,
    chartConfig,
    pieData,
    legendItems,
    totalIndividualDelegators,
    othersValue,
    othersPercentage,
  };
};
