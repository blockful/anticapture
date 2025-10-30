import {
  useDaoData,
  useActiveSupply,
  useDelegatedSupply,
  useAverageTurnout,
  useTokenData,
} from "@/shared/hooks";
import { useTreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { useCompareTreasury } from "@/features/dao-overview/hooks/useCompareTreasury";
import { useTopDelegatesToPass } from "@/features/dao-overview/hooks/useTopDelegatesToPass";
import { useDaoTreasuryStats } from "@/features/dao-overview/hooks/useDaoTreasuryStats";
import { useDaoQuorumStats } from "@/features/dao-overview/hooks/useDaoQuorumStats";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { formatEther } from "viem";
import { useGetDelegatesQuery } from "@anticapture/graphql-client/hooks";

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

  const delegates = useGetDelegatesQuery({
    variables: {
      after: undefined,
      before: undefined,
      orderBy: "votingPower",
      orderDirection: "desc",
      limit: 20,
    },
    context: { headers: { "anticapture-dao-id": daoId } },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always check network for fresh data
  });

  const topDelegates = delegates.data?.accountPowers?.items || [];

  const totalSupply = tokenData.data?.totalSupply;

  const proposalThresholdPercentage =
    daoData?.data?.proposalThreshold &&
    totalSupply !== undefined &&
    formatEther(
      (BigInt(daoData.data.proposalThreshold) * BigInt(1e20)) /
        BigInt(totalSupply ?? ("1" as string)),
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
    totalSupply,
    delegatedSupply,
    daoConfig,
  });

  const treasuryStats = useDaoTreasuryStats({
    treasuryAll,
    treasuryNonDao,
    tokenData,
  });

  const topDelegatesToPass = useTopDelegatesToPass({
    topDelegates,
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
    delegates.loading;

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
