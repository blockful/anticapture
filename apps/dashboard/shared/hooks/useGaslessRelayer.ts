import { useMemo } from "react";
import { zeroAddress, type Address } from "viem";

import {
  useAccountBalanceByAccountId,
  useGetConfig,
  useGetRateLimit,
  useGetRelayerBalance,
  useVotingPowerByAccountId,
} from "@anticapture/client/hooks";
import type {
  AccountBalanceByAccountIdPathParamsDaoEnumKey,
  GetConfigPathParamsDaoEnumKey,
  GetRateLimitPathParamsDaoEnumKey,
  GetRelayerBalancePathParamsDaoEnumKey,
  VotingPowerByAccountIdPathParamsDaoEnumKey,
} from "@anticapture/client";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

interface UseRelayerConfigResult {
  enabled: boolean;
  minVotingPower: bigint | null;
  voteLimit: number | null;
  delegationLimit: number | null;
  isLoading: boolean;
}

const toDaoKey = (daoId: DaoIdEnum) => daoId.toLowerCase();

interface UseRelayerBalanceResult {
  hasEnoughBalance: boolean | null;
  isLoading: boolean;
}

export const useRelayerBalance = (
  daoId: DaoIdEnum,
): UseRelayerBalanceResult => {
  const enabled = daoConfigByDaoId[daoId].gaslessRelayer === true;

  const { data, isLoading } = useGetRelayerBalance(
    toDaoKey(daoId) as GetRelayerBalancePathParamsDaoEnumKey,
    { query: { enabled } },
  );

  return {
    hasEnoughBalance: data?.hasEnoughBalance ?? null,
    isLoading: enabled && isLoading,
  };
};

export const useRelayerConfig = (daoId: DaoIdEnum): UseRelayerConfigResult => {
  const gaslessEnabled = daoConfigByDaoId[daoId].gaslessRelayer === true;
  const { hasEnoughBalance, isLoading: balanceLoading } =
    useRelayerBalance(daoId);
  const enabled = gaslessEnabled && hasEnoughBalance === true;

  const { data, isLoading } = useGetConfig(
    toDaoKey(daoId) as GetConfigPathParamsDaoEnumKey,
    { query: { enabled } },
  );

  const minVotingPower = useMemo(() => {
    if (!data?.minVotingPower) return null;
    try {
      return BigInt(data.minVotingPower);
    } catch {
      return null;
    }
  }, [data?.minVotingPower]);

  return {
    enabled,
    minVotingPower,
    voteLimit: data?.limits.vote ?? null,
    delegationLimit: data?.limits.delegation ?? null,
    isLoading: gaslessEnabled && (balanceLoading || (enabled && isLoading)),
  };
};

interface UseRelayerRateLimitResult {
  voteRemaining: number | null;
  delegationRemaining: number | null;
  voteLimit: number | null;
  delegationLimit: number | null;
  resetsAt: string | null;
  isLoading: boolean;
}

export const useRelayerRateLimit = (
  daoId: DaoIdEnum,
  address: Address | undefined,
): UseRelayerRateLimitResult => {
  const gaslessEnabled =
    daoConfigByDaoId[daoId].gaslessRelayer === true && !!address;
  const { hasEnoughBalance, isLoading: balanceLoading } =
    useRelayerBalance(daoId);
  const enabled = gaslessEnabled && hasEnoughBalance === true;

  const { data, isLoading } = useGetRateLimit(
    toDaoKey(daoId) as GetRateLimitPathParamsDaoEnumKey,
    address ?? zeroAddress,
    { query: { enabled } },
  );

  return {
    voteRemaining: data?.vote.remaining ?? null,
    delegationRemaining: data?.delegation.remaining ?? null,
    voteLimit: data?.vote.limit ?? null,
    delegationLimit: data?.delegation.limit ?? null,
    resetsAt: data?.resetsAt ?? null,
    isLoading: gaslessEnabled && (balanceLoading || (enabled && isLoading)),
  };
};

interface UseGaslessEligibilityResult {
  isEligible: boolean;
  remaining: number | null;
  isLoading: boolean;
}

export const useGaslessEligibility = (
  daoId: DaoIdEnum,
  address: Address | undefined,
  operation: "vote" | "delegate",
): UseGaslessEligibilityResult => {
  const gaslessEnabled = daoConfigByDaoId[daoId].gaslessRelayer === true;

  const { hasEnoughBalance, isLoading: balanceLoading } =
    useRelayerBalance(daoId);
  const { minVotingPower, isLoading: configLoading } = useRelayerConfig(daoId);
  const {
    voteRemaining,
    delegationRemaining,
    isLoading: rateLimitLoading,
  } = useRelayerRateLimit(daoId, address);

  const queryEnabled = gaslessEnabled && !!address && hasEnoughBalance === true;

  const isVote = operation === "vote";

  const { data: vpData, isLoading: vpLoading } = useVotingPowerByAccountId(
    toDaoKey(daoId) as VotingPowerByAccountIdPathParamsDaoEnumKey,
    address ?? zeroAddress,
    undefined,
    { query: { enabled: queryEnabled && isVote } },
  );

  const { data: balanceData, isLoading: balanceQueryLoading } =
    useAccountBalanceByAccountId(
      toDaoKey(daoId) as AccountBalanceByAccountIdPathParamsDaoEnumKey,
      address ?? zeroAddress,
      undefined,
      { query: { enabled: queryEnabled && !isVote } },
    );

  const rawEligibilityAmount = isVote
    ? (vpData?.votingPower ?? null)
    : (balanceData?.data?.balance ?? null);
  const eligibilityLoading = isVote ? vpLoading : balanceQueryLoading;
  const remaining = isVote ? voteRemaining : delegationRemaining;

  const isLoading =
    gaslessEnabled &&
    !!address &&
    (balanceLoading ||
      (hasEnoughBalance === true &&
        (configLoading || rateLimitLoading || eligibilityLoading)));

  const isEligible =
    gaslessEnabled &&
    !isLoading &&
    hasEnoughBalance === true &&
    rawEligibilityAmount !== null &&
    minVotingPower !== null &&
    BigInt(rawEligibilityAmount) >= minVotingPower &&
    remaining !== null &&
    remaining > 0;

  return { isEligible, remaining, isLoading };
};
