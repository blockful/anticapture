import { useMemo } from "react";
import { zeroAddress, type Address } from "viem";

import {
  useGetConfig,
  useGetRateLimit,
  useVotingPowerByAccountId,
} from "@anticapture/client/hooks";
import type {
  GetConfigPathParamsDaoEnumKey,
  GetRateLimitPathParamsDaoEnumKey,
  VotingPowerByAccountIdPathParamsDaoEnumKey,
} from "@anticapture/client";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

interface UseRelayerConfigResult {
  enabled: boolean;
  minVotingPower: bigint | null;
  maxRelayPerAddressPerDay: number | null;
  isLoading: boolean;
}

const toDaoKey = (daoId: DaoIdEnum) => daoId.toLowerCase();

export const useRelayerConfig = (daoId: DaoIdEnum): UseRelayerConfigResult => {
  const enabled = daoConfigByDaoId[daoId].gaslessRelayer === true;

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
    maxRelayPerAddressPerDay: data?.maxRelayPerAddressPerDay ?? null,
    isLoading: enabled && isLoading,
  };
};

interface UseRelayerRateLimitResult {
  voteRemaining: number | null;
  delegationRemaining: number | null;
  maxPerDay: number | null;
  resetsAt: string | null;
  isLoading: boolean;
}

export const useRelayerRateLimit = (
  daoId: DaoIdEnum,
  address: Address | undefined,
): UseRelayerRateLimitResult => {
  const enabled = daoConfigByDaoId[daoId].gaslessRelayer === true && !!address;

  const { data, isLoading } = useGetRateLimit(
    toDaoKey(daoId) as GetRateLimitPathParamsDaoEnumKey,
    address ?? zeroAddress,
    { query: { enabled } },
  );

  return {
    voteRemaining: data?.vote.remaining ?? null,
    delegationRemaining: data?.delegation.remaining ?? null,
    maxPerDay: data?.maxPerDay ?? null,
    resetsAt: data?.resetsAt ?? null,
    isLoading: enabled && isLoading,
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

  const { minVotingPower, isLoading: configLoading } = useRelayerConfig(daoId);
  const {
    voteRemaining,
    delegationRemaining,
    isLoading: rateLimitLoading,
  } = useRelayerRateLimit(daoId, address);

  const queryEnabled = gaslessEnabled && !!address;
  const { data: vpData, isLoading: vpLoading } = useVotingPowerByAccountId(
    toDaoKey(daoId) as VotingPowerByAccountIdPathParamsDaoEnumKey,
    address ?? zeroAddress,
    undefined,
    { query: { enabled: queryEnabled } },
  );

  const rawVotingPower = vpData?.votingPower ?? null;
  const remaining = operation === "vote" ? voteRemaining : delegationRemaining;

  const isLoading =
    queryEnabled && (configLoading || rateLimitLoading || vpLoading);

  const isEligible =
    gaslessEnabled &&
    !isLoading &&
    rawVotingPower !== null &&
    minVotingPower !== null &&
    BigInt(rawVotingPower) >= minVotingPower &&
    remaining !== null &&
    remaining > 0;

  return { isEligible, remaining, isLoading };
};
