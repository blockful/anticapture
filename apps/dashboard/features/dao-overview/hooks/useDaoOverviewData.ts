import {
  useDaoData,
  useActiveSupply,
  useDelegatedSupply,
  useAverageTurnout,
  useTimeSeriesData,
  useTokenData,
} from "@/shared/hooks";
import { useTreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import { useTokenHolders } from "@/features/holders-and-delegates";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { useCompareTreasury } from "@/features/dao-overview/hooks/useCompareTreasury";
import { useTopDelegatesToPass } from "@/features/dao-overview/hooks/useTopDelegatesToPass";
import { useDaoTreasuryStats } from "@/features/dao-overview/hooks/useDaoTreasuryStats";
import { useDaoQuorumStats } from "@/features/dao-overview/hooks/useDaoQuorumStats";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { calculateChangeRate } from "@/features/token-distribution/utils";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { formatEther } from "viem";

export const useDaoOverviewData = ({
  daoId,
  daoConfig,
}: {
  daoId: DaoIdEnum;
  daoConfig: DaoConfiguration;
}) => {
  const daoData = useDaoData(daoId);
  const activeSupply = useActiveSupply(daoId, TimeInterval.NINETY_DAYS);
  const delegatedSupply = useDelegatedSupply(daoId, TimeInterval.NINETY_DAYS);
  const averageTurnout = useAverageTurnout(daoId, TimeInterval.NINETY_DAYS);
  const treasuryNonDao = useTreasuryAssetNonDaoToken(
    daoId,
    TimeInterval.NINETY_DAYS,
  );
  const treasuryAll = useCompareTreasury(daoId, TimeInterval.NINETY_DAYS);
  const tokenData = useTokenData(daoId);

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
    daoData?.data?.proposalThreshold &&
    totalSupplyValue.value !== undefined &&
    formatEther(
      (BigInt(daoData.data.proposalThreshold) * BigInt(1e20)) /
        BigInt(totalSupplyValue.value ?? ("1" as string)),
    );

  const proposalThresholdValue = daoData?.data?.proposalThreshold
    ? `${formatNumberUserReadable(Number(daoData.data.proposalThreshold) / 10 ** 18)}`
    : "No Threshold";

  const {
    quorumValue,
    averageTurnoutPercentAboveQuorum,
    quorumPercentage,
    quorumValueFormatted,
  } = useDaoQuorumStats({
    daoData: daoData.data,
    averageTurnout,
    totalSupplyValue,
    delegatedSupply,
    daoConfig,
  });

  const treasuryStats = useDaoTreasuryStats({
    treasuryAll,
    treasuryNonDao,
    tokenData,
  });

  const topDelegatesToPass = useTopDelegatesToPass({
    holders,
    quorumValue,
  });

  const votingPeriod = daoData?.data?.votingPeriod;
  const votingDelay = daoData?.data?.votingDelay;
  const timelockDelay = daoData?.data?.timelockDelay;

  const isLoading =
    daoData.loading ||
    activeSupply.isLoading ||
    delegatedSupply.isLoading ||
    averageTurnout.isLoading ||
    tokenData.isLoading ||
    treasuryNonDao.loading ||
    treasuryAll.loading ||
    holders.loading ||
    totalSupply.isLoading;

  return {
    daoData: daoData.data,
    activeSupply,
    delegatedSupply,
    averageTurnout,
    treasuryStats,
    quorumValue,
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
