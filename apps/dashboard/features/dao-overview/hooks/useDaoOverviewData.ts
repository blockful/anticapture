import type {
  CompareActiveSupplyPathParamsDaoEnumKey,
  CompareAverageTurnoutPathParamsDaoEnumKey,
  DaoPathParamsDaoEnumKey,
  TokenPathParamsDaoEnumKey,
  VotingPowersPathParamsDaoEnumKey,
} from "@anticapture/client";
import {
  useCompareActiveSupply,
  useCompareAverageTurnout,
  useDao,
  useToken,
  useVotingPowers,
} from "@anticapture/client/hooks";
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
  const daoKey = daoId.toLowerCase();

  const { data: daoData, isLoading: daoLoading } = useDao(
    daoKey as DaoPathParamsDaoEnumKey,
  );
  const { data: activeSupplyData, isLoading: activeSupplyLoading } =
    useCompareActiveSupply(
      daoKey as CompareActiveSupplyPathParamsDaoEnumKey,
      { days: TimeInterval.NINETY_DAYS },
    );
  const { data: averageTurnoutData, isLoading: averageTurnoutLoading } =
    useCompareAverageTurnout(
      daoKey as CompareAverageTurnoutPathParamsDaoEnumKey,
      { days: TimeInterval.NINETY_DAYS },
    );
  const { data: tokenData, isLoading: tokenLoading } = useToken(
    daoKey as TokenPathParamsDaoEnumKey,
    { currency: "usd" },
  );
  const { data: votingPowersData, isLoading: delegatesLoading } =
    useVotingPowers(daoKey as VotingPowersPathParamsDaoEnumKey, {
      limit: 20,
      orderDirection: "desc",
    });

  const totalSupply = tokenData?.totalSupply;

  const proposalThresholdPercentage =
    daoData?.proposalThreshold && totalSupply
      ? (
          (Number(
            formatUnits(BigInt(daoData.proposalThreshold), decimals),
          ) /
            Number(formatUnits(BigInt(totalSupply), decimals))) *
          100
        ).toString()
      : "0";

  const proposalThresholdValue = daoData?.proposalThreshold
    ? `${formatNumberUserReadable(Number(formatUnits(BigInt(daoData.proposalThreshold), decimals)))}`
    : "No Threshold";

  const quorumValue = Number(
    formatUnits(BigInt(daoData?.quorum || 0), decimals),
  );

  const treasuryStats = useDaoTreasuryStats({
    daoId,
    tokenData: { data: tokenData ?? null },
  });

  const topDelegatesToPass = useTopDelegatesToPass({
    topDelegates:
      votingPowersData?.items.filter(
        (item) => item !== null && item !== undefined,
      ) || [],
    quorumValue,
    decimals,
  });

  return {
    daoData: daoData ?? null,
    activeSupply: Number(
      formatUnits(BigInt(activeSupplyData?.activeSupply || 0), decimals),
    ),
    delegatedSupply: Number(
      formatUnits(BigInt(tokenData?.delegatedSupply || 0), decimals),
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
