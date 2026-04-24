"use client";

import { useMemo } from "react";
import { useGetDaoDataQuery } from "@anticapture/graphql-client/hooks";
import { formatUnits } from "viem";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export type UseProposalThresholdReturn = {
  threshold: bigint | null;
  thresholdFormatted: string | null;
  isLoading: boolean;
};

export function useProposalThreshold(
  daoId: string,
): UseProposalThresholdReturn {
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { data, loading: isLoading } = useGetDaoDataQuery({
    context: { headers: { "anticapture-dao-id": daoIdEnum } },
    skip: !daoId,
  });

  return useMemo(() => {
    const raw = data?.dao?.proposalThreshold;
    if (raw == null) {
      return { threshold: null, thresholdFormatted: null, isLoading };
    }
    const threshold = BigInt(raw);
    const decimals = daoConfig[daoIdEnum]?.decimals ?? 18;
    const formatted = formatUnits(threshold, decimals);
    return { threshold, thresholdFormatted: formatted, isLoading };
  }, [data, daoIdEnum, isLoading]);
}
