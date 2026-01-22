import { formatUnits } from "viem";

import {
  useDaoData,
  useActiveSupply,
  useAverageTurnout,
  useTokenData,
} from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { useTopDelegatesToPass } from "@/features/dao-overview/hooks/useTopDelegatesToPass";
import { useDaoTreasuryStats } from "@/features/dao-overview/hooks/useDaoTreasuryStats";
import { formatNumberUserReadable } from "@/shared/utils";
import { DaoConfiguration } from "@/shared/dao-config/types";
import {
  QueryInput_VotingPowers_OrderDirection,
  useGetDelegatesQuery,
} from "@anticapture/graphql-client/hooks";

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
  const tokenData = useTokenData(daoId);

  const delegates = useGetDelegatesQuery({
    variables: {
      orderDirection: QueryInput_VotingPowers_OrderDirection.Desc,
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
          (Number(
            formatUnits(BigInt(daoData.data.proposalThreshold), decimals),
          ) /
            Number(formatUnits(BigInt(totalSupply), decimals))) *
          100
        ).toString()
      : "0";

  const proposalThresholdValue = daoData?.data?.proposalThreshold
    ? `${formatNumberUserReadable(Number(formatUnits(BigInt(daoData.data.proposalThreshold), decimals)))}`
    : "No Threshold";

  const quorumValue = Number(
    formatUnits(BigInt(daoData.data?.quorum || 0), decimals),
  );

  const treasuryStats = useDaoTreasuryStats({
    daoId,
    tokenData,
  });

  const topDelegatesToPass = useTopDelegatesToPass({
    topDelegates:
      delegates.data?.votingPowers?.items.filter(
        (item) => item !== null && item !== undefined,
      ) || [],
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
      delegates.loading,
  };
};
