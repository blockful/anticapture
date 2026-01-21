"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { ApolloError } from "@apollo/client";
import { formatUnits } from "viem";

import { useHistoricalVotingPowersQuery } from "@anticapture/graphql-client/hooks";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  HistoricalVotingPowersQuery,
  QueryHistoricalVotingPowersArgs,
  QueryInput_HistoricalVotingPowers_OrderDirection,
} from "@anticapture/graphql-client";

// Interface for a single delegation history item
export interface DelegationHistoryItem {
  timestamp: string;
  transactionHash: string;
  delta: string; // Amount the selected address won or lost in votingPower
  delegation?: {
    from: string;
    value: string;
    to: string;
  } | null;
  transfer?: {
    value: string;
    from: string;
    to: string;
  } | null;
  votingPower: string;
  type: "delegation" | "transfer";
  action: string;
  isGain: boolean; // true if delegate gains voting power, false if loses
}

// Interface for pagination info
export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
}

// Interface for the hook result
export interface UseDelegateDelegationHistoryResult {
  delegationHistory: DelegationHistoryItem[];
  loading: boolean;
  error: ApolloError | undefined;
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type AmountFilterVariables = Pick<
  QueryHistoricalVotingPowersArgs,
  "fromValue" | "toValue"
>;

export function useDelegateDelegationHistory({
  accountId,
  daoId,
  orderBy = "timestamp",
  orderDirection = "desc",
  filterVariables,
  customFromFilter,
  customToFilter,
  itemsPerPage = 10,
}: {
  accountId: string;
  daoId: DaoIdEnum;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  transactionType?: "all" | "buy" | "sell";
  customFromFilter?: string;
  customToFilter?: string;
  filterVariables?: AmountFilterVariables;
  itemsPerPage?: number;
}): UseDelegateDelegationHistoryResult {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPaginationLoading, setIsPaginationLoading] =
    useState<boolean>(false);
  const {
    daoOverview: { token },
  } = daoConfig[daoId as DaoIdEnum];

  // Reset page to 1 when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection, accountId, customFromFilter, customToFilter]);

  const { fromFilter, toFilter } = useMemo(() => {
    if (customToFilter && customToFilter !== accountId) {
      return {
        fromFilter: accountId,
        toFilter: customToFilter,
      };
    }

    if (customFromFilter && customFromFilter !== accountId) {
      return {
        fromFilter: customFromFilter,
        toFilter: accountId,
      };
    }
    return {
      fromFilter: accountId,
      toFilter: accountId,
    };
  }, [accountId, customFromFilter, customToFilter]);

  const queryVariables = useMemo(
    () => ({
      account: accountId,
      limit: itemsPerPage,
      orderBy: orderBy as QueryHistoricalVotingPowersArgs["orderBy"],
      orderDirection:
        orderDirection as QueryInput_HistoricalVotingPowers_OrderDirection,
      ...(filterVariables?.toValue && { toValue: filterVariables.toValue }),
      ...(filterVariables?.fromValue && {
        fromValue: filterVariables.fromValue,
      }),
      ...(fromFilter && { delegator: fromFilter }),
      ...(toFilter && { delegate: toFilter }),
    }),
    [
      accountId,
      itemsPerPage,
      orderBy,
      orderDirection,
      filterVariables,
      fromFilter,
      toFilter,
    ],
  );

  const queryOptions = {
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network" as const,
  };

  const { data, error, loading, fetchMore } = useHistoricalVotingPowersQuery({
    variables: queryVariables,
    ...queryOptions,
  });

  // Transform raw data to our format
  const transformedData = useMemo(() => {
    if (!data?.historicalVotingPowers?.items) return [];

    return data.historicalVotingPowers.items
      .filter((item) => !!item)
      .map((item) => {
        // Determine the type, action, and direction based on the data and delta
        let type: "delegation" | "transfer" = "delegation";
        let action = "Unknown";

        // Parse delta to determine if it's a gain or loss
        const delta = Number(
          token === "ERC20"
            ? formatUnits(BigInt(item.delta || "0"), 18)
            : item.delta || "0",
        );
        const isGain = delta > 0;

        if (item.delegation) {
          type = "delegation";
          // Check if delegate gains or loses voting power
          if (item.delegation.to === accountId) {
            // Delegate gains voting power - someone delegated to them
            action = `Received delegation from ${item.delegation.from}`;
          } else {
            // Delegate loses voting power - delegator transferred delegation to someone else
            action = `Lost delegation from ${item.delegation.from}`;
          }
        } else if (item.transfer) {
          type = "transfer";
          // For transfers, the selected address should always be at the delegates column
          // If delta is negative, fromAccountId should be at the delegator column
          // If delta is positive, toAccountId should be at the delegator column
          if (isGain) {
            action = `Received transfer from ${item.transfer.from}`;
          } else {
            action = `Sent transfer to ${item.transfer.to}`;
          }
        }

        return {
          timestamp: item.timestamp,
          transactionHash: item.transactionHash,
          delta: delta.toString(),
          delegation: item.delegation,
          transfer: item.transfer,
          votingPower: item.votingPower,
          type,
          action,
          isGain,
        };
      });
  }, [data, accountId, token]);

  const hasNextPage = useMemo(() => {
    return (
      currentPage * itemsPerPage <
      (data?.historicalVotingPowers?.totalCount || 0)
    );
  }, [currentPage, itemsPerPage, data?.historicalVotingPowers?.totalCount]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (isPaginationLoading || !hasNextPage) return;
    setIsPaginationLoading(true);

    const nextPage = currentPage + 1;
    const skip = (nextPage - 1) * itemsPerPage;

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          skip,
        },
        updateQuery: (
          previousResult: HistoricalVotingPowersQuery,
          { fetchMoreResult },
        ): HistoricalVotingPowersQuery => {
          if (!fetchMoreResult) return previousResult;

          return {
            historicalVotingPowers: {
              ...fetchMoreResult.historicalVotingPowers,
              items: [
                ...(previousResult.historicalVotingPowers?.items ?? []),
                ...(fetchMoreResult.historicalVotingPowers?.items ?? []),
              ],
              totalCount:
                fetchMoreResult?.historicalVotingPowers?.totalCount ?? 0,
            },
          };
        },
      });

      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [currentPage, itemsPerPage, hasNextPage, isPaginationLoading, fetchMore]);

  return {
    delegationHistory: transformedData,
    loading,
    error,
    fetchNextPage,
    hasNextPage,
    hasPreviousPage: currentPage > 1,
  };
}
