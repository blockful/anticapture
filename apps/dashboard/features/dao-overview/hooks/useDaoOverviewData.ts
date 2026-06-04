import {
  useCompareActiveSupply,
  useCompareAverageTurnout,
  useDao,
  useToken,
  useVotingPowers,
} from "@anticapture/client/hooks";
import type {
  CompareActiveSupplyPathParamsDaoEnumKey,
  CompareAverageTurnoutPathParamsDaoEnumKey,
  DaoPathParamsDaoEnumKey,
  TokenPathParamsDaoEnumKey,
  VotingPowersPathParamsDaoEnumKey,
} from "@anticapture/client";
import { formatUnits } from "viem";

import { useDaoTreasuryStats } from "@/features/dao-overview/hooks/useDaoTreasuryStats";
import { useTopDelegatesToPass } from "@/features/dao-overview/hooks/useTopDelegatesToPass";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import type { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { formatNumberUserReadable } from "@/shared/utils";

export const useDaoOverviewData = ({
  daoId,
  daoConfig,
}: {
  daoId: DaoIdEnum;
  daoConfig: DaoConfiguration;
}) => {
  const { decimals } = daoConfig;
  const dao = daoId.toLowerCase();

  const { data: daoData, isLoading: daoLoading } = useDao(
    dao as DaoPathParamsDaoEnumKey,
  );

  const { data: activeSupplyData, isLoading: activeSupplyLoading } =
    useCompareActiveSupply(dao as CompareActiveSupplyPathParamsDaoEnumKey, {
      days: TimeInterval.NINETY_DAYS,
    });

  const { data: averageTurnoutData, isLoading: averageTurnoutLoading } =
    useCompareAverageTurnout(dao as CompareAverageTurnoutPathParamsDaoEnumKey, {
      days: TimeInterval.NINETY_DAYS,
    });

  const { data: tokenData, isLoading: tokenLoading } = useToken(
    dao as TokenPathParamsDaoEnumKey,
    { currency: "usd" },
  );

  const { data: delegatesData, isLoading: delegatesLoading } = useVotingPowers(
    dao as VotingPowersPathParamsDaoEnumKey,
    { orderDirection: "desc", limit: 20 },
  );

  const totalSupply = tokenData?.totalSupply;

  const proposalThresholdPercentage =
    daoData?.proposalThreshold && totalSupply
      ? (
          (Number(formatUnits(daoData.proposalThreshold, decimals)) /
            Number(formatUnits(totalSupply, decimals))) *
          100
        ).toString()
      : "0";

  const proposalThresholdValue = daoData?.proposalThreshold
    ? `${formatNumberUserReadable(Number(formatUnits(daoData.proposalThreshold, decimals)))}`
    : "No Threshold";

  const quorumValue = Number(formatUnits(daoData?.quorum ?? 0n, decimals));

  const treasuryStats = useDaoTreasuryStats({
    daoId,
    tokenData,
  });

  const topDelegatesToPass = useTopDelegatesToPass({
    topDelegates:
      delegatesData?.items.map((item) => ({
        votingPower: item.votingPower.toString(),
        accountId: item.accountId,
      })) || [],
    quorumValue,
    decimals,
  });

  return {
    daoData: daoData ?? null,
    activeSupply: Number(
      formatUnits(activeSupplyData?.activeSupply || 0n, decimals),
    ),
    delegatedSupply: Number(
      formatUnits(tokenData?.delegatedSupply || 0n, decimals),
    ),
    averageTurnout: Number(
      formatUnits(
        BigInt(averageTurnoutData?.currentAverageTurnout || 0),
        decimals,
      ),
    ),
    treasuryStats,
    quorumValue,
    topDelegatesToPass,
    proposalThresholdValue,
    proposalThresholdPercentage,
    quorumValueFormatted: quorumValue,
    votingPeriod: Number(daoData?.votingPeriod ?? 0),
    votingDelay: Number(daoData?.votingDelay ?? 0),
    timelockDelay: Number(daoData?.timelockDelay ?? 0),
    isLoading:
      daoLoading ||
      activeSupplyLoading ||
      averageTurnoutLoading ||
      tokenLoading ||
      delegatesLoading,
  };
};
