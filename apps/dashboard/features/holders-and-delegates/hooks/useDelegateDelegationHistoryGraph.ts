"use client";

import type { HistoricalVotingPowerByAccountIdPathParamsDaoEnumKey } from "@anticapture/client";
import { useHistoricalVotingPowerByAccountId } from "@anticapture/client/hooks";
import { useMemo } from "react";
import { formatUnits, parseUnits } from "viem";

import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface DelegationHistoryGraphItem {
  timestamp: number;
  votingPower: number;
  delta: number;
  type: "delegation" | "transfer";
  isGain: boolean;
  transactionHash: string;
  fromAddress?: string;
  toAddress?: string;
}

export interface UseDelegateDelegationHistoryGraphResult {
  delegationHistory: DelegationHistoryGraphItem[];
  loading: boolean;
  error: unknown;
}

/**
 * Voting power at the two edges of the selected period, read straight from the
 * API instead of from the rows the graph plots. The graph query hides
 * low-importance deltas and keeps only the newest 1,000 rows, so its first row
 * is not the period's opening voting power for an active delegate: a limit-1
 * lookup on either side of the boundary is, and it ignores the display filter.
 */
export function useDelegateVotingPowerBoundaries(
  accountId: string,
  daoId: DaoIdEnum,
  fromTimestamp?: number,
  toTimestamp?: number,
): { startingVotingPower: number; endingVotingPower: number } {
  const { decimals } = daoConfig[daoId];
  const dao =
    daoId.toLowerCase() as HistoricalVotingPowerByAccountIdPathParamsDaoEnumKey;

  // The last event strictly before the period: its running voting power is what
  // the delegate held when the period opened. No row means it held none.
  const { data: openingData } = useHistoricalVotingPowerByAccountId(
    dao,
    accountId,
    {
      limit: 1,
      orderDirection: "desc",
      ...(fromTimestamp ? { toDate: fromTimestamp - 1 } : {}),
    },
    { query: { enabled: Boolean(accountId && fromTimestamp) } },
  );

  const { data: closingData } = useHistoricalVotingPowerByAccountId(
    dao,
    accountId,
    {
      limit: 1,
      orderDirection: "desc",
      ...(toTimestamp ? { toDate: toTimestamp } : {}),
    },
    { query: { enabled: Boolean(accountId) } },
  );

  const toTokens = (raw?: bigint | string | number) =>
    raw === undefined
      ? 0
      : Number(formatUnits(BigInt(raw.toString()), decimals));

  return {
    startingVotingPower: fromTimestamp
      ? toTokens(openingData?.items?.[0]?.votingPower)
      : 0,
    endingVotingPower: toTokens(closingData?.items?.[0]?.votingPower),
  };
}

export function useDelegateDelegationHistoryGraph(
  accountId: string,
  daoId: DaoIdEnum,
  fromTimestamp?: number,
  toTimestamp?: number,
  filterLowImportance?: boolean,
): UseDelegateDelegationHistoryGraphResult {
  const { decimals } = daoConfig[daoId];

  const { data, isLoading, error } = useHistoricalVotingPowerByAccountId(
    daoId.toLowerCase() as HistoricalVotingPowerByAccountIdPathParamsDaoEnumKey,
    accountId,
    {
      // low importance filter hides deltas below 1 whole token
      fromValue: filterLowImportance
        ? parseUnits("1", decimals).toString()
        : "1",
      limit: 1000,
      orderDirection: "desc",
      ...(fromTimestamp ? { fromDate: fromTimestamp } : {}),
      ...(toTimestamp ? { toDate: toTimestamp } : {}),
    },
    { query: { enabled: !!accountId } },
  );

  const delegationHistory = useMemo((): DelegationHistoryGraphItem[] => {
    if (!data?.items) return [];

    return (
      data.items
        .filter((item) => !!item)
        .map((item) => {
          const delta = Number(
            formatUnits(BigInt(item.delta.toString()), decimals),
          );
          return {
            timestamp: new Date(Number(item.timestamp) * 1000).getTime(),
            votingPower: Number(
              formatUnits(BigInt(item.votingPower.toString()), decimals),
            ),
            delta,
            type: item.delegation
              ? "delegation"
              : ("transfer" as "delegation" | "transfer"),
            isGain: delta > 0,
            transactionHash: item.transactionHash,
            fromAddress: item.delegation?.from ?? item.transfer?.from,
            toAddress: item.delegation?.to ?? item.transfer?.to,
          };
        })
        // this is needed to ensure the graph is displayed in the ascending order
        // although the query should be sorted by timestamp in descending order
        .sort((a, b) => a.timestamp - b.timestamp)
    );
  }, [data, decimals]);

  return {
    delegationHistory,
    loading: isLoading,
    error,
  };
}
