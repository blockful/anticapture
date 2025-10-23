import { useMemo } from "react";
import {
  useDaoData,
  useActiveSupply,
  useDelegatedSupply,
  useAverageTurnout,
  useTimeSeriesData,
} from "@/shared/hooks";
import {
  useDaoTokenHistoricalData,
  useTreasuryAssetNonDaoToken,
} from "@/features/attack-profitability/hooks";
import { useTokenHolders } from "@/features/holders-and-delegates";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { formatEther } from "viem";
import { useCompareTreasury } from "@/features/dao-overview/hooks/useCompareTreasury";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { calculateChangeRate } from "@/features/token-distribution/utils";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoConfiguration } from "@/shared/dao-config/types";

export const useDaoOverviewData = ({
  daoId,
  daoConfig,
}: {
  daoId: DaoIdEnum;
  daoConfig: DaoConfiguration;
}) => {
  const { data: daoData } = useDaoData(daoId);
  const activeSupply = useActiveSupply(daoId, TimeInterval.NINETY_DAYS);
  const delegatedSupply = useDelegatedSupply(daoId, TimeInterval.NINETY_DAYS);
  const averageTurnout = useAverageTurnout(daoId, TimeInterval.NINETY_DAYS);
  const tokenPrice = useDaoTokenHistoricalData({
    daoId,
    days: TimeInterval.SEVEN_DAYS,
  });
  const treasuryNonDao = useTreasuryAssetNonDaoToken(
    daoId,
    TimeInterval.NINETY_DAYS,
  );
  const treasuryAll = useCompareTreasury(daoId, TimeInterval.NINETY_DAYS);
  const holders = useTokenHolders({
    daoId,
    limit: 20,
    orderDirection: "desc",
    days: TimeInterval.NINETY_DAYS,
  });
  const totalSupply = useTimeSeriesData(
    daoId,
    [MetricTypesEnum.TOTAL_SUPPLY],
    TimeInterval.SEVEN_DAYS,
  );

  const totalSupplyValue = {
    value:
      totalSupply.data?.[MetricTypesEnum.TOTAL_SUPPLY]?.at(-1)?.high ?? null,
    changeRate: calculateChangeRate(
      totalSupply.data?.[MetricTypesEnum.TOTAL_SUPPLY],
    ),
  };

  const proposalThresholdPercentage =
    daoData?.proposalThreshold &&
    totalSupplyValue.value !== undefined &&
    formatEther(
      (BigInt(daoData.proposalThreshold) * BigInt(1e20)) /
        BigInt(totalSupplyValue.value ?? ("1" as string)),
    );

  const proposalThresholdValue = daoData?.proposalThreshold
    ? `${formatNumberUserReadable(Number(daoData.proposalThreshold) / 10 ** 18)}`
    : "No Threshold";

  const lastPrice = tokenPrice.data?.prices?.at(-1)?.[1] ?? 0;

  const quorumMinPercentage =
    daoData?.quorum &&
    totalSupplyValue.value !== undefined &&
    formatEther(
      (BigInt(daoData.quorum) * BigInt(1e20)) /
        BigInt(totalSupplyValue.value ?? ("1" as string)),
    );

  const quorumMinPercentageDelSupply =
    delegatedSupply.data?.currentDelegatedSupply &&
    formatEther(
      (BigInt(delegatedSupply.data.currentDelegatedSupply) * BigInt(30)) /
        BigInt(100),
    );

  const quorumValue = daoData?.quorum ? Number(daoData.quorum) / 10 ** 18 : 0;

  const quorumValueTotalSupply = quorumValue
    ? `${formatNumberUserReadable(quorumValue)} `
    : "No Quorum";

  const quorumValueDelSupply = quorumMinPercentageDelSupply
    ? `${formatNumberUserReadable(parseFloat(quorumMinPercentageDelSupply))} `
    : "No Quorum";

  const quorumPercentageDelSupply = quorumMinPercentageDelSupply
    ? `(30% ${daoConfig.daoOverview.rules?.quorumCalculation})`
    : "(N/A)";

  const quorumPercentageTotalSupply = quorumMinPercentage
    ? `(${parseFloat(quorumMinPercentage).toFixed(1)}% ${daoConfig.daoOverview.rules?.quorumCalculation})`
    : "(N/A)";

  const quorumPercentage =
    daoConfig.daoOverview.rules?.quorumCalculation === "Del. Supply"
      ? quorumPercentageDelSupply
      : quorumPercentageTotalSupply;

  const quorumValueFormatted =
    daoConfig.daoOverview.rules?.quorumCalculation === "Del. Supply"
      ? quorumValueDelSupply
      : quorumValueTotalSupply;

  const liquidTreasuryNonDaoValue = Number(
    treasuryNonDao.data?.[0]?.totalAssets || 0,
  );

  const daoTreasuryTokens = Number(treasuryAll.data?.currentTreasury || 0);
  const liquidTreasuryAllValue =
    Number(formatEther(BigInt(daoTreasuryTokens))) * lastPrice;

  const liquidTreasuryAllPercent = liquidTreasuryAllValue
    ? Math.round(
        ((liquidTreasuryAllValue - liquidTreasuryNonDaoValue) /
          liquidTreasuryAllValue) *
          100,
      ).toString()
    : "0";

  const averageTurnoutPercentAboveQuorum = useMemo(() => {
    if (!averageTurnout.data || !quorumValue) return 0;
    const turnoutTokens =
      Number(averageTurnout.data.currentAverageTurnout) / 10 ** 18;
    return (turnoutTokens / quorumValue - 1) * 100;
  }, [averageTurnout.data, quorumValue]);

  const topDelegatesToPass = useMemo(() => {
    if (!holders.data || !quorumValue) return null;
    const topHolders = holders.data
      .map((holder) => ({
        balance: Number(holder.balance) / 10 ** 18,
      }))
      .sort((a, b) => b.balance - a.balance);

    let topDelegatesBalance = 0;
    let topDelegatesCount = 0;
    for (const holder of topHolders) {
      topDelegatesBalance += holder.balance;
      topDelegatesCount++;
      if (topDelegatesBalance >= quorumValue) break;
    }

    if (topDelegatesBalance < quorumValue) return "20+";

    return topDelegatesCount;
  }, [holders.data, quorumValue]);

  const votingPeriod = daoData?.votingPeriod;
  const votingDelay = daoData?.votingDelay;
  const timelockDelay = daoData?.timelockDelay;

  const isLoading =
    activeSupply.isLoading ||
    delegatedSupply.isLoading ||
    averageTurnout.isLoading ||
    treasuryNonDao.loading ||
    treasuryAll.loading ||
    tokenPrice.loading ||
    holders.loading ||
    totalSupply.isLoading;

  return {
    daoData,
    activeSupply,
    delegatedSupply,
    averageTurnout,
    treasuryNonDao,
    holders,
    lastPrice,
    quorumValue,
    liquidTreasuryAllValue,
    liquidTreasuryNonDaoValue,
    liquidTreasuryAllPercent,
    averageTurnoutPercentAboveQuorum,
    topDelegatesToPass,
    isLoading,
    proposalThresholdValue,
    proposalThresholdPercentage,
    quorumValueFormatted,
    quorumPercentage,
    votingPeriod,
    votingDelay,
    timelockDelay,
  };
};
