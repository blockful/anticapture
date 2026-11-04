import { useMemo } from "react";
import { zeroAddress, type Address } from "viem";

import {
  useAccountBalanceByAccountId,
  useGetConfig,
  useGetRateLimit,
  useGetRelayerStatus,
  useVotingPowerByAccountId,
} from "@anticapture/client/hooks";
import type {
  AccountBalanceByAccountIdPathParamsDaoEnumKey,
  GetConfigPathParamsDaoEnumKey,
  GetRateLimitPathParamsDaoEnumKey,
  GetRelayerStatusPathParamsDaoEnumKey,
  RelayerStatusReason,
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

/**
 * The relayer's config and an address's rate limit change at most once per
 * relayed transaction. The status hook alone is mounted by the config,
 * rate-limit and eligibility hooks and by every enactment modal, and with no
 * stale time each new observer refetched: the relayer logged the same three
 * GETs two or three times within one second. A vote invalidates the rate
 * limit itself once it is relayed.
 */
const RELAYER_QUERY_STALE_MS = 60_000;

/**
 * How long a relayer status answer is trusted. Shorter than the config and
 * rate-limit stale time: the status is what decides whether the ballot goes
 * through the relayer at all, and a relayer that broke a minute ago should
 * stop being offered well before the voter gives up on it.
 */
const RELAYER_STATUS_STALE_MS = 30_000;

/**
 * How often an open page asks again. Every observer of the status lives as
 * long as the page (the voting and delegation modals stay mounted while
 * closed), so the stale time alone never triggers a refetch: without this a
 * relayer that broke after the page loaded kept being offered until the
 * window lost and regained focus. Paused while the tab is in the background.
 */
const RELAYER_STATUS_REFRESH_MS = 60_000;

interface UseRelayerStatusResult {
  /**
   * Whether the gasless path may be offered. Null while the first answer is
   * on its way; false for a DAO without a relayer, for every reason the
   * relayer or the gateway reports, and for a request that failed outright.
   */
  isAvailable: boolean | null;
  reasons: RelayerStatusReason[];
  isLoading: boolean;
}

/**
 * Whether the relayer can sponsor a transaction right now, from the one
 * endpoint that checks everything it depends on: the pause switch, the RPC,
 * the wallet balance, the rate limiter, stuck nonces and recent broadcast
 * failures. Gateful answers on the relayer's behalf when it is down, so the
 * gasless path is offered only on an explicit `available: true`. Anything
 * else, including an error, leaves the voter on their own wallet, which is
 * the path that never depends on this service.
 */
export const useRelayerStatus = (daoId: DaoIdEnum): UseRelayerStatusResult => {
  const enabled = daoConfigByDaoId[daoId].gaslessRelayer === true;

  const { data, isLoading, isError } = useGetRelayerStatus(
    toDaoKey(daoId) as GetRelayerStatusPathParamsDaoEnumKey,
    {
      query: {
        enabled,
        staleTime: RELAYER_STATUS_STALE_MS,
        refetchInterval: RELAYER_STATUS_REFRESH_MS,
        // A failed status read already means "use the wallet"; retrying it
        // would only hold the ballot on the slower path for longer.
        retry: false,
      },
    },
  );

  if (!enabled) return { isAvailable: false, reasons: [], isLoading: false };
  if (isError) return { isAvailable: false, reasons: [], isLoading: false };

  return {
    isAvailable: data ? data.available === true : null,
    reasons: data?.reasons ?? [],
    isLoading,
  };
};

interface UseGaslessEnactmentResult {
  /** The relayer can sponsor queue()/execute() for this DAO right now. */
  isAvailable: boolean;
  isLoading: boolean;
}

/**
 * Queue and execute are permissionless and carry no signer, so the only
 * things that gate the gasless path are the DAO having a relayer and that
 * relayer reporting itself available. No voting power or per-address rate
 * limit applies.
 */
export const useGaslessEnactment = (
  daoId: DaoIdEnum,
): UseGaslessEnactmentResult => {
  const gaslessEnabled = daoConfigByDaoId[daoId].gaslessRelayer === true;
  const { isAvailable, isLoading } = useRelayerStatus(daoId);

  return {
    isAvailable: gaslessEnabled && isAvailable === true,
    isLoading: gaslessEnabled && isLoading,
  };
};

export const useRelayerConfig = (daoId: DaoIdEnum): UseRelayerConfigResult => {
  const gaslessEnabled = daoConfigByDaoId[daoId].gaslessRelayer === true;
  const { isAvailable: isRelayerAvailable, isLoading: statusLoading } =
    useRelayerStatus(daoId);
  const enabled = gaslessEnabled && isRelayerAvailable === true;

  const { data, isLoading } = useGetConfig(
    toDaoKey(daoId) as GetConfigPathParamsDaoEnumKey,
    { query: { enabled, staleTime: RELAYER_QUERY_STALE_MS } },
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
    voteLimit: data?.limits?.vote ?? null,
    delegationLimit: data?.limits?.delegation ?? null,
    isLoading: gaslessEnabled && (statusLoading || (enabled && isLoading)),
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
  const { isAvailable: isRelayerAvailable, isLoading: statusLoading } =
    useRelayerStatus(daoId);
  const enabled = gaslessEnabled && isRelayerAvailable === true;

  const { data, isLoading } = useGetRateLimit(
    toDaoKey(daoId) as GetRateLimitPathParamsDaoEnumKey,
    address ?? zeroAddress,
    { query: { enabled, staleTime: RELAYER_QUERY_STALE_MS } },
  );

  return {
    voteRemaining: data?.vote?.remaining ?? null,
    delegationRemaining: data?.delegation?.remaining ?? null,
    voteLimit: data?.vote?.limit ?? null,
    delegationLimit: data?.delegation?.limit ?? null,
    resetsAt: data?.resetsAt ?? null,
    isLoading: gaslessEnabled && (statusLoading || (enabled && isLoading)),
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

  const { isAvailable: isRelayerAvailable, isLoading: statusLoading } =
    useRelayerStatus(daoId);
  const { minVotingPower, isLoading: configLoading } = useRelayerConfig(daoId);
  const {
    voteRemaining,
    delegationRemaining,
    isLoading: rateLimitLoading,
  } = useRelayerRateLimit(daoId, address);

  const queryEnabled =
    gaslessEnabled && !!address && isRelayerAvailable === true;

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
    (statusLoading ||
      (isRelayerAvailable === true &&
        (configLoading || rateLimitLoading || eligibilityLoading)));

  const isEligible =
    gaslessEnabled &&
    !isLoading &&
    isRelayerAvailable === true &&
    rawEligibilityAmount !== null &&
    minVotingPower !== null &&
    BigInt(rawEligibilityAmount) >= minVotingPower &&
    remaining !== null &&
    remaining > 0;

  return { isEligible, remaining, isLoading };
};
