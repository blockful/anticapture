"use client";

import type { HistoricalVotingPowerByAccountIdPathParamsDaoEnumKey } from "@anticapture/client";
import { useHistoricalVotingPowerByAccountId } from "@anticapture/client/hooks";
import { useMemo } from "react";
import { formatUnits } from "viem";

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

export function useDelegateDelegationHistoryGraph(
  accountId: string,
  daoId: DaoIdEnum,
  fromTimestamp?: number,
  toTimestamp?: number,
): UseDelegateDelegationHistoryGraphResult {
  const { decimals } = daoConfig[daoId];

  const { data, isLoading, error } = useHistoricalVotingPowerByAccountId(
    daoId.toLowerCase() as HistoricalVotingPowerByAccountIdPathParamsDaoEnumKey,
    accountId,
    {
      fromValue: "1",
      limit: 1000,
      orderDirection: "asc",
      ...(fromTimestamp ? { fromDate: fromTimestamp } : {}),
      ...(toTimestamp ? { toDate: toTimestamp } : {}),
    },
    { query: { enabled: !!accountId } },
  );

  const delegationHistory = useMemo((): DelegationHistoryGraphItem[] => {
    if (!data?.items) return [];

    return data.items
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
      });
  }, [data, decimals]);

  return {
    delegationHistory,
    loading: isLoading,
    error,
  };
}
