import { formatUnits } from "viem";

import type { ProposalsPathParamsDaoEnumKey } from "@anticapture/client";
import { useProposals } from "@anticapture/client/hooks";
import {
  DaysWindow,
  useCompareAverageTurnoutQuery,
  useGetDaoDataQuery,
} from "@anticapture/graphql-client/hooks";

import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export const useQuorumGap = (daoId: DaoIdEnum) => {
  const days = 90;
  const cutoffDate = Math.floor(
    new Date(new Date().setDate(new Date().getDate() - days)).getTime() / 1000,
  );

  const context = {
    headers: {
      "anticapture-dao-id": daoId,
    },
  };

  const {
    data: daoData,
    loading: daoLoading,
    error: daoError,
  } = useGetDaoDataQuery({
    context,
    skip: !daoId,
  });

  const {
    data: proposalsData,
    isLoading: proposalsLoading,
    error: proposalsError,
  } = useProposals(daoId.toLowerCase() as ProposalsPathParamsDaoEnumKey, {
    limit: 1,
    fromDate: cutoffDate,
  });

  const {
    data: turnoutData,
    loading: turnoutLoading,
    error: turnoutError,
  } = useCompareAverageTurnoutQuery({
    variables: {
      days: DaysWindow["90d"],
    },
    context,
    skip: !daoId,
  });

  const isLoading = daoLoading || proposalsLoading || turnoutLoading;
  const error = daoError || proposalsError || turnoutError;

  let quorumGap: number | null = null;

  if (!isLoading && !error && daoData && proposalsData && turnoutData) {
    const { decimals } = daoConfig[daoId];

    const isGapEligible = proposalsData.items.length > 0;
    const quorum = daoData.dao?.quorum
      ? Number(formatUnits(BigInt(daoData.dao.quorum), decimals))
      : null;
    const avgTurnout = turnoutData.compareAverageTurnout?.currentAverageTurnout
      ? Number(
          formatUnits(
            BigInt(turnoutData.compareAverageTurnout.currentAverageTurnout),
            decimals,
          ),
        )
      : null;
    const gap = quorum && avgTurnout ? (avgTurnout / quorum - 1) * 100 : 0;

    quorumGap = isGapEligible ? gap : null;
  }

  return {
    data: quorumGap,
    isLoading,
    error: error || null,
  };
};
