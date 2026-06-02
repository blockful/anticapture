"use client";

import {
  type HistoricalVotingPower,
  type HistoricalVotingPowerByAccountIdPathParamsDaoEnumKey,
  type HistoricalVotingPowerByAccountIdQueryParamsOrderByEnumKey,
  type HistoricalVotingPowerDelegation,
  type HistoricalVotingPowerTransfer,
  getNextPageParam,
} from "@anticapture/client";
import { useHistoricalVotingPowerByAccountIdInfinite } from "@anticapture/client/hooks";
import { useMemo } from "react";
import { formatUnits } from "viem";

import type { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/types";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type StringifyBigInt<T> = {
  [K in keyof T]: T[K] extends bigint ? string : T[K];
};

export interface DelegationHistoryItem {
  timestamp: string;
  transactionHash: HistoricalVotingPower["transactionHash"];
  delta: string;
  delegation: StringifyBigInt<
    NonNullable<HistoricalVotingPowerDelegation>
  > | null;
  transfer: StringifyBigInt<NonNullable<HistoricalVotingPowerTransfer>> | null;
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
  fetchingMore: boolean;
}

interface UseDelegateDelegationHistoryParams {
  accountId: string;
  daoId: DaoIdEnum;
  orderBy?: HistoricalVotingPowerByAccountIdQueryParamsOrderByEnumKey;
  orderDirection?: "asc" | "desc";
  filterVariables?: AmountFilterVariables;
  fromTimestamp?: number;
  toTimestamp?: number;
  limit?: number;
}

export function useDelegateDelegationHistory({
  accountId,
  daoId,
  orderBy = "timestamp",
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
      orderBy,
      orderDirection,
      ...(filterVariables?.fromValue
        ? { fromValue: filterVariables.fromValue }
        : {}),
      ...(filterVariables?.toValue ? { toValue: filterVariables.toValue } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [limit, orderBy, orderDirection, filterVariables, fromDate, toDate],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHistoricalVotingPowerByAccountIdInfinite(
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

  return {
    delegationHistory,
    loading: isLoading,
    error: error ?? null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    hasPreviousPage: (data?.pages?.length ?? 0) > 1,
    fetchingMore: isFetchingNextPage,
  };
}
