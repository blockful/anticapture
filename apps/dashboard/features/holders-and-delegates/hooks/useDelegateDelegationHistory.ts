"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { ApolloError, NetworkStatus } from "@apollo/client";
import { formatUnits } from "viem";

import { useHistoricalVotingPowerByAccountQuery } from "@anticapture/graphql-client/hooks";
import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  HistoricalVotingPowerByAccountQuery,
  HistoricalVotingPowerByAccountQueryVariables,
  QueryInput_HistoricalVotingPowerByAccount_OrderDirection,
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
  paginationInfo: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  fetchingMore: boolean;
}

export type AmountFilterVariables = Pick<
  HistoricalVotingPowerByAccountQueryVariables,
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
      orderBy:
        orderBy as HistoricalVotingPowerByAccountQueryVariables["orderBy"],
      orderDirection:
        orderDirection as QueryInput_HistoricalVotingPowerByAccount_OrderDirection,
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

  const { data, error, fetchMore, networkStatus } =
    useHistoricalVotingPowerByAccountQuery({
      variables: queryVariables,
      ...queryOptions,
    });

  // Transform raw data to our format
  const transformedData = useMemo(() => {
    if (!data?.historicalVotingPowerByAccount?.items) return [];

    return data.historicalVotingPowerByAccount.items
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

  const totalCount = data?.historicalVotingPowerByAccount?.totalCount ?? 0;
  const currentItemsCount = transformedData.length;
  const hasNextPage = currentItemsCount < totalCount;

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (isPaginationLoading || !hasNextPage) return;
    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          skip: currentItemsCount,
        },
        updateQuery: (
          previousResult: HistoricalVotingPowerByAccountQuery,
          { fetchMoreResult },
        ): HistoricalVotingPowerByAccountQuery => {
          if (!fetchMoreResult) return previousResult;
          const prevItems =
            previousResult.historicalVotingPowerByAccount?.items ?? [];
          const newItems =
            fetchMoreResult.historicalVotingPowerByAccount?.items ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) =>
                !prevItems.some(
                  (p) => p?.transactionHash === n?.transactionHash,
                ),
            ),
          ];

          return {
            ...fetchMoreResult,
            historicalVotingPowerByAccount: {
              ...fetchMoreResult.historicalVotingPowerByAccount,
              items: merged,
              totalCount:
                fetchMoreResult.historicalVotingPowerByAccount?.totalCount ?? 0,
            },
          };
        },
      });

      setCurrentPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching next page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    isPaginationLoading,
    queryVariables,
    currentItemsCount,
    hasNextPage,
  ]);

  // Fetch previous page function
  const fetchPreviousPage = useCallback(async () => {
    if (isPaginationLoading) return;
    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          skip: (currentPage - 2) * itemsPerPage,
        },
        updateQuery: (_, { fetchMoreResult }) => fetchMoreResult,
      });

      setCurrentPage((prev) => prev - 1);
    } catch (error) {
      console.error("Error fetching previous page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    isPaginationLoading,
    queryVariables,
    currentPage,
    itemsPerPage,
  ]);

  const isLoading = useMemo(() => {
    return (
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.refetch
    );
  }, [networkStatus]);

  return {
    delegationHistory: transformedData,
    loading: isLoading,
    paginationInfo: {
      currentPage,
      totalPages: Math.ceil(
        (data?.historicalVotingPowerByAccount?.totalCount || 0) / itemsPerPage,
      ),
      hasNextPage:
        currentPage * itemsPerPage <
        (data?.historicalVotingPowerByAccount?.totalCount || 0),
      hasPreviousPage: currentPage > 1,
    },
    error,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
}
