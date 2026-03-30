import { formatUnits } from "viem";

import {
  DaysWindow,
  useCompareAverageTurnoutQuery,
  useGetDaoDataQuery,
  useGetProposalsFromDaoQuery,
} from "@anticapture/graphql-client/hooks";

import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

export const useQuorumGap = (daoId: DaoIdEnum) => {
  const days = 90;
  const cutoffDate = Math.floor(
    new Date(new Date().setDate(new Date().getDate() - days)).getTime() / 1000,
  );

  const context = {
    headers: {
      "anticapture-dao-id": daoId,
      ...getAuthHeaders(),
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
    loading: proposalsLoading,
    error: proposalsError,
  } = useGetProposalsFromDaoQuery({
    variables: {
      skip: 0,
      limit: 1,
      fromDate: cutoffDate,
      status: null,
    },
    context,
    skip: !daoId,
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

    const isGapEligible = (proposalsData.proposals?.items?.length ?? 0) > 0;
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
