"use client";

import type {
  HistoricalVotingPowerByAccountIdPathParamsDaoEnumKey,
  HistoricalVotingPowerByAccountIdQueryResponse,
} from "@anticapture/client";
import { useHistoricalVotingPowerByAccountIdInfinite } from "@anticapture/client/hooks";
import { useCallback, useMemo } from "react";
import { formatUnits } from "viem";

import type { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/types";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export interface DelegationHistoryItem {
  timestamp: string;
  transactionHash: string;
  delta: string;
  delegation?: {
    from: string;
    value: string;
    to: string;
    previousDelegate?: string | null;
  } | null;
  transfer?: {
    value: string;
    from: string;
    to: string;
  } | null;
  votingPower: string;
  type: "delegation" | "transfer";
  action: string;
  isGain: boolean;
}

export interface UseDelegateDelegationHistoryResult {
  delegationHistory: DelegationHistoryItem[];
  loading: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseDelegateDelegationHistoryParams {
  accountId: string;
  daoId: DaoIdEnum;
  orderDirection?: "asc" | "desc";
  filterVariables?: AmountFilterVariables;
  fromTimestamp?: number;
  toTimestamp?: number;
  limit?: number;
}

const getNextPageParam = (
  lastPage: HistoricalVotingPowerByAccountIdQueryResponse,
  allPages: HistoricalVotingPowerByAccountIdQueryResponse[],
): number | undefined => {
  const loaded = allPages.reduce((s, p) => s + p.items.length, 0);
  return loaded >= lastPage.totalCount ? undefined : loaded;
};

export function useDelegateDelegationHistory({
  accountId,
  daoId,
  orderDirection = "desc",
  filterVariables,
  fromTimestamp: fromDate,
  toTimestamp: toDate,
  limit = 10,
}: UseDelegateDelegationHistoryParams): UseDelegateDelegationHistoryResult {
  const {
    daoOverview: { token },
  } = daoConfig[daoId as DaoIdEnum];

  const params = useMemo(
    () => ({
      limit,
      orderDirection,
      ...(filterVariables?.fromValue
        ? { fromValue: filterVariables.fromValue }
        : {}),
      ...(filterVariables?.toValue ? { toValue: filterVariables.toValue } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [limit, orderDirection, filterVariables, fromDate, toDate],
  );

  const { data, isLoading, error, fetchNextPage, hasNextPage } =
    useHistoricalVotingPowerByAccountIdInfinite(
      daoId.toLowerCase() as HistoricalVotingPowerByAccountIdPathParamsDaoEnumKey,
      accountId,
      params,
      { query: { getNextPageParam } },
    );

  const delegationHistory = useMemo(() => {
    if (!data?.pages) return [];

    return data.pages
      .flatMap((p) => p.items)
      .filter((item) => !!item)
      .map((item) => {
        let type: "delegation" | "transfer" = "delegation";
        let action = "Unknown";

        const delta = Number(
          token === "ERC20"
            ? formatUnits(BigInt(item.delta || "0"), 18)
            : item.delta || "0",
        );
        const isGain = delta > 0;

        if (item.delegation) {
          type = "delegation";
          if (item.delegation.to === accountId) {
            action = `Received delegation from ${item.delegation.from}`;
          } else {
            action = `Lost delegation from ${item.delegation.from}`;
          }
        } else if (item.transfer) {
          type = "transfer";
          if (isGain) {
            action = `Received transfer from ${item.transfer.from}`;
          } else {
            action = `Sent transfer to ${item.transfer.to}`;
          }
        }

        return {
          timestamp: item.timestamp.toString(),
          transactionHash: item.transactionHash,
          delta: delta.toString(),
          delegation: item.delegation
            ? {
                from: item.delegation.from,
                value: item.delegation.value.toString(),
                to: item.delegation.to,
                previousDelegate: item.delegation.previousDelegate ?? null,
              }
            : null,
          transfer: item.transfer
            ? {
                value: item.transfer.value.toString(),
                from: item.transfer.from,
                to: item.transfer.to,
              }
            : null,
          votingPower: item.votingPower.toString(),
          type,
          action,
          isGain,
        };
      });
  }, [data, accountId, token]);

  const fetchNextPageStable = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return {
    delegationHistory,
    loading: isLoading,
    error: error ?? null,
    fetchNextPage: fetchNextPageStable,
    hasNextPage: hasNextPage ?? false,
    hasPreviousPage: (data?.pages?.length ?? 0) > 1,
  };
}
