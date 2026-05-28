import {
  useCompareAverageTurnout,
  useDao,
  useProposals,
} from "@anticapture/client/hooks";
import type {
  CompareAverageTurnoutPathParamsDaoEnumKey,
  DaoPathParamsDaoEnumKey,
  ProposalsPathParamsDaoEnumKey,
} from "@anticapture/client";
import { formatUnits } from "viem";

import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export const useQuorumGap = (daoId: DaoIdEnum) => {
  const days = 90;
  const cutoffDate = Math.floor(
    new Date(new Date().setDate(new Date().getDate() - days)).getTime() / 1000,
  );

  const dao = daoId.toLowerCase();

  const {
    data: daoData,
    isLoading: daoLoading,
    error: daoError,
  } = useDao(dao as DaoPathParamsDaoEnumKey);

  const {
    data: proposalsData,
    isLoading: proposalsLoading,
    error: proposalsError,
  } = useProposals(dao as ProposalsPathParamsDaoEnumKey, {
    limit: 1,
    fromDate: cutoffDate,
  });

  const {
    data: turnoutData,
    isLoading: turnoutLoading,
    error: turnoutError,
  } = useCompareAverageTurnout(
    dao as CompareAverageTurnoutPathParamsDaoEnumKey,
    { days: "90d" },
  );

  const isLoading = daoLoading || proposalsLoading || turnoutLoading;
  const error = daoError || proposalsError || turnoutError;

  let quorumGap: number | null = null;

  if (!isLoading && !error && daoData && proposalsData && turnoutData) {
    const { decimals } = daoConfig[daoId];

    const isGapEligible = proposalsData.items.length > 0;
    const quorum = Number(formatUnits(daoData.quorum, decimals));
    const avgTurnout = Number(
      formatUnits(BigInt(turnoutData.currentAverageTurnout), decimals),
    );

    const gap = quorum && avgTurnout ? (avgTurnout / quorum - 1) * 100 : 0;

    quorumGap = isGapEligible ? gap : null;
  }

  return {
    data: quorumGap,
    isLoading,
    error: error || null,
  };
};
