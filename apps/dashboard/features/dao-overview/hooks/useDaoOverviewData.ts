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

// Mirrors Apollo's fetchPolicy: "no-cache".
const NO_CACHE_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: "always",
} as const;

// Mirrors Apollo's fetchPolicy: "cache-and-network".
const CACHE_AND_NETWORK_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: "always",
} as const;

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
    useCompareActiveSupply(
      dao as CompareActiveSupplyPathParamsDaoEnumKey,
      { days: TimeInterval.NINETY_DAYS },
      { query: NO_CACHE_QUERY_OPTIONS },
    );

  const { data: averageTurnoutData, isLoading: averageTurnoutLoading } =
    useCompareAverageTurnout(dao as CompareAverageTurnoutPathParamsDaoEnumKey, {
      days: TimeInterval.NINETY_DAYS,
    });

  const { data: tokenData, isLoading: tokenLoading } = useToken(
    dao as TokenPathParamsDaoEnumKey,
    { currency: "usd" },
    { query: NO_CACHE_QUERY_OPTIONS },
  );

  const { data: delegatesData, isLoading: delegatesLoading } = useVotingPowers(
    dao as VotingPowersPathParamsDaoEnumKey,
    { orderDirection: "desc", limit: 20 },
    { query: CACHE_AND_NETWORK_QUERY_OPTIONS },
  );

  const totalSupply = tokenData?.totalSupply;

  const proposalThresholdPercentage =
    daoData?.proposalThreshold && totalSupply
      ? (
          (Number(formatUnits(BigInt(daoData.proposalThreshold), decimals)) /
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
      delegatesData?.items
        .filter((item) => item !== null && item !== undefined)
        .map((item) => ({
          votingPower: item.votingPower.toString(),
          accountId: item.accountId,
        })) || [],
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
