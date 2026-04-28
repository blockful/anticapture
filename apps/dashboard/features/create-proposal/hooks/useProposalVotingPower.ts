"use client";

import { useMemo } from "react";
import { type Abi } from "viem";
import { useBlockNumber, useReadContract } from "wagmi";

import { useProposalThreshold } from "@/features/create-proposal/hooks/useProposalThreshold";

export type UseProposalVotingPowerReturn = {
  votingPower: bigint;
  threshold: bigint | null;
  hasEnough: boolean;
  isLoading: boolean;
};

const getVotesAbi = [
  {
    type: "function",
    name: "getVotes",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "blockNumber", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;

export function useProposalVotingPower(
  daoId: string,
  address: string | undefined,
  governorAddress: `0x${string}` | undefined,
): UseProposalVotingPowerReturn {
  const { data: currentBlock } = useBlockNumber();
  const snapshotBlock =
    currentBlock !== undefined ? currentBlock - 1n : undefined;

  const { data: votesRaw, isLoading: isVpLoading } = useReadContract({
    abi: getVotesAbi,
    address: governorAddress,
    functionName: "getVotes",
    args:
      address && snapshotBlock !== undefined
        ? [address as `0x${string}`, snapshotBlock]
        : undefined,
    query: {
      enabled: Boolean(
        address && governorAddress && snapshotBlock !== undefined,
      ),
    },
  });

  const { threshold, isLoading: isThresholdLoading } =
    useProposalThreshold(daoId);

  return useMemo(() => {
    const votingPower = votesRaw ?? 0n;
    const hasEnough = threshold != null && votingPower >= threshold;
    return {
      votingPower,
      threshold,
      hasEnough,
      isLoading: isVpLoading || isThresholdLoading,
    };
  }, [votesRaw, threshold, isVpLoading, isThresholdLoading]);
}
