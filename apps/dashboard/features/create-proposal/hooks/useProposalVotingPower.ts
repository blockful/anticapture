"use client";

import { useMemo } from "react";
import { useGetVotingPowerQuery } from "@anticapture/graphql-client/hooks";
import type { DaoIdEnum } from "@/shared/types/daos";
import { useProposalThreshold } from "@/features/create-proposal/hooks/useProposalThreshold";

export type UseProposalVotingPowerReturn = {
  votingPower: bigint;
  threshold: bigint | null;
  hasEnough: boolean;
  isLoading: boolean;
};

export function useProposalVotingPower(
  daoId: string,
  address: string | undefined,
): UseProposalVotingPowerReturn {
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { data, loading: isVpLoading } = useGetVotingPowerQuery({
    variables: { address: address ?? "" },
    context: { headers: { "anticapture-dao-id": daoIdEnum } },
    skip: !address,
  });
  const { threshold, isLoading: isThresholdLoading } =
    useProposalThreshold(daoId);

  return useMemo(() => {
    const raw = data?.votingPowerByAccountId?.votingPower;
    const votingPower = raw != null ? BigInt(raw) : 0n;
    const hasEnough = threshold != null && votingPower >= threshold;
    return {
      votingPower,
      threshold,
      hasEnough,
      isLoading: isVpLoading || isThresholdLoading,
    };
  }, [data, threshold, isVpLoading, isThresholdLoading]);
}
