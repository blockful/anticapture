"use client";

import {
  accountBalanceByAccountIdPathParamsDaoEnum,
  delegationsPathParamsDaoEnum,
  proposalsActivityPathParamsDaoEnum,
  votingPowerByAccountIdPathParamsDaoEnum,
  type AccountBalanceByAccountIdPathParamsDaoEnumKey,
  type DelegationsPathParamsDaoEnumKey,
  type ProposalsActivityPathParamsDaoEnumKey,
  type VotingPowerByAccountIdPathParamsDaoEnumKey,
} from "@anticapture/client";
import {
  useAccountBalanceByAccountId,
  useDelegations,
  useProposalsActivity,
  useVotingPowerByAccountId,
} from "@anticapture/client/hooks";
import type { Address } from "viem";
import { formatUnits, zeroAddress } from "viem";

import { isServedBy } from "@/features/holders-and-delegates/profile/utils/isServedBy";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export type SummaryMetric<T> =
  | { status: "loading" }
  | { status: "error" }
  // The DAO's API does not serve this metric.
  | { status: "unsupported" }
  | { status: "ready"; value: T };

export interface AddressProfileSummary {
  votingPower: SummaryMetric<number>;
  balance: SummaryMetric<number | null>;
  delegatorsCount: SummaryMetric<number>;
  /** Null when the address delegates to no one. */
  delegatingTo: SummaryMetric<Address | null>;
  participation: SummaryMetric<{
    votedProposals: number;
    totalProposals: number;
    winRate: number;
    yesRate: number;
    avgTimeBeforeEnd: number;
  }>;
  /**
   * True once every supported metric loaded and none shows a trace of the
   * address in this DAO: no voting power, no delegators, no votes and no token
   * account. Loading or failed metrics never count as "no activity".
   */
  hasNoActivity: boolean;
}

const toTokenAmount = (raw: string | number | bigint, decimals: number) =>
  Number(formatUnits(BigInt(raw.toString()), decimals));

const toMetric = <TData, TValue>({
  isServed,
  isLoading,
  data,
  select,
}: {
  isServed: boolean;
  isLoading: boolean;
  data: TData | undefined;
  select: (data: TData) => TValue;
}): SummaryMetric<TValue> => {
  if (!isServed) return { status: "unsupported" };
  if (isLoading) return { status: "loading" };
  if (data === undefined) return { status: "error" };
  return { status: "ready", value: select(data) };
};

/** Account-level numbers for the profile summary, one query per endpoint. */
export const useAddressProfileSummary = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: Address;
}): AddressProfileSummary => {
  const dao = daoId.toLowerCase();
  const { decimals } = daoConfigByDaoId[daoId];

  const servesVotingPower = isServedBy(
    votingPowerByAccountIdPathParamsDaoEnum,
    daoId,
  );
  const servesBalance = isServedBy(
    accountBalanceByAccountIdPathParamsDaoEnum,
    daoId,
  );
  const servesDelegations = isServedBy(delegationsPathParamsDaoEnum, daoId);
  const servesActivity = isServedBy(proposalsActivityPathParamsDaoEnum, daoId);

  const votingPowerQuery = useVotingPowerByAccountId(
    dao as VotingPowerByAccountIdPathParamsDaoEnumKey,
    address,
    undefined,
    { query: { enabled: servesVotingPower } },
  );
  const balanceQuery = useAccountBalanceByAccountId(
    dao as AccountBalanceByAccountIdPathParamsDaoEnumKey,
    address,
    undefined,
    { query: { enabled: servesBalance } },
  );
  const delegationsQuery = useDelegations(
    dao as DelegationsPathParamsDaoEnumKey,
    address,
    { query: { enabled: servesDelegations } },
  );
  const activityQuery = useProposalsActivity(
    dao as ProposalsActivityPathParamsDaoEnumKey,
    // Only the totals are read; the vote list itself lives in the Votes tab.
    { address, limit: 1 },
    { query: { enabled: servesActivity } },
  );

  const votingPowerData = votingPowerQuery.data;

  const votingPower = toMetric({
    isServed: servesVotingPower,
    isLoading: votingPowerQuery.isLoading,
    data: votingPowerData,
    select: (data) => toTokenAmount(data.votingPower, decimals),
  });

  const delegatorsCount = toMetric({
    isServed: servesVotingPower,
    isLoading: votingPowerQuery.isLoading,
    data: votingPowerData,
    select: (data) => data.delegationsCount,
  });

  // 404 is the API saying the address never held the token: an answer, not a
  // failure.
  const hasNoTokenAccount = balanceQuery.error?.status === 404;
  const balance: SummaryMetric<number | null> = hasNoTokenAccount
    ? { status: "ready", value: null }
    : toMetric({
        isServed: servesBalance,
        isLoading: balanceQuery.isLoading,
        data: balanceQuery.data,
        select: (data) => toTokenAmount(data.data.balance, decimals),
      });

  const delegatingTo = toMetric({
    isServed: servesDelegations,
    isLoading: delegationsQuery.isLoading,
    data: delegationsQuery.data,
    select: (data): Address | null =>
      data.items.find(
        (item) => item.delegateAddress.toLowerCase() !== zeroAddress,
      )?.delegateAddress ?? null,
  });

  const participation = toMetric({
    isServed: servesActivity,
    isLoading: activityQuery.isLoading,
    data: activityQuery.data,
    select: (data) => ({
      votedProposals: data.votedProposals,
      totalProposals: data.totalProposals,
      winRate: data.winRate,
      yesRate: data.yesRate,
      avgTimeBeforeEnd: data.avgTimeBeforeEnd,
    }),
  });

  const metrics = [votingPower, balance, delegatingTo, participation];
  const hasSettled = metrics.every(
    (metric) => metric.status === "ready" || metric.status === "unsupported",
  );
  const hasAnyTrace =
    (votingPower.status === "ready" && votingPower.value > 0) ||
    (votingPowerData?.delegationsCount ?? 0) > 0 ||
    (votingPowerData?.votesCount ?? 0) > 0 ||
    (balance.status === "ready" && balance.value !== null) ||
    (delegatingTo.status === "ready" && delegatingTo.value !== null) ||
    (participation.status === "ready" &&
      participation.value.votedProposals > 0);

  return {
    votingPower,
    balance,
    delegatorsCount,
    delegatingTo,
    participation,
    hasNoActivity: hasSettled && !hasAnyTrace,
  };
};
