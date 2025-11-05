import { formatUnits, parseUnits } from "viem";

import {
  useDaoData,
  useActiveSupply,
  useAverageTurnout,
  useTokenData,
} from "@/shared/hooks";
import { useTreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { useCompareTreasury } from "@/features/dao-overview/hooks/useCompareTreasury";
import { useTopDelegatesToPass } from "@/features/dao-overview/hooks/useTopDelegatesToPass";
import { useDaoTreasuryStats } from "@/features/dao-overview/hooks/useDaoTreasuryStats";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { useGetDelegatesQuery } from "@anticapture/graphql-client/hooks";

export const useDaoOverviewData = ({
  daoId,
  daoConfig,
}: {
  daoId: DaoIdEnum;
  daoConfig: DaoConfiguration;
}) => {
  const { decimals } = daoConfig;

  const daoData = useDaoData(daoId);
  const activeSupply = useActiveSupply(daoId, TimeInterval.NINETY_DAYS);
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

  const totalSupply = tokenData.data?.totalSupply;

  const proposalThresholdPercentage =
    daoData?.data?.proposalThreshold && totalSupply
      ? (
          parseUnits(daoData.data.proposalThreshold, decimals) /
          parseUnits(totalSupply, decimals)
        ).toString()
      : "0";

  const proposalThresholdValue = daoData?.data?.proposalThreshold
    ? `${formatNumberUserReadable(Number(formatUnits(BigInt(daoData.data.proposalThreshold), decimals)))}`
    : "No Threshold";

  const quorumValue = Number(
    formatUnits(BigInt(daoData.data?.quorum || 0), decimals),
  );

  const turnoutValue = Number(
    formatUnits(
      BigInt(averageTurnout.data?.currentAverageTurnout || 0),
      decimals,
    ),
  );

  const treasuryStats = useDaoTreasuryStats({
    treasuryAll,
    treasuryNonDao,
    tokenData,
  });

  const topDelegatesToPass = useTopDelegatesToPass({
    topDelegates: delegates.data?.accountPowers?.items || [],
    quorumValue,
    decimals,
  });

  return {
    daoData: daoData.data,
    activeSupply: Number(
      formatUnits(BigInt(activeSupply.data?.activeSupply || 0), decimals),
    ),
    delegatedSupply: Number(
      formatUnits(BigInt(tokenData.data?.delegatedSupply || 0), decimals),
    ),
    averageTurnout: Number(
      formatUnits(
        BigInt(averageTurnout.data?.currentAverageTurnout || 0),
        decimals,
      ),
    ),
    treasuryStats,
    quorumValue,
    averageTurnoutPercentAboveQuorum: (turnoutValue / quorumValue - 1) * 100,
    topDelegatesToPass,
    proposalThresholdValue,
    proposalThresholdPercentage,
    quorumValueFormatted: quorumValue,
    votingPeriod: Number(daoData.data?.votingPeriod ?? 0),
    votingDelay: Number(daoData.data?.votingDelay ?? 0),
    timelockDelay: Number(daoData.data?.timelockDelay ?? 0),
    isLoading:
      daoData.loading ||
      activeSupply.isLoading ||
      averageTurnout.isLoading ||
      tokenData.isLoading ||
      treasuryNonDao.loading ||
      treasuryAll.loading ||
      delegates.loading,
  };
};
