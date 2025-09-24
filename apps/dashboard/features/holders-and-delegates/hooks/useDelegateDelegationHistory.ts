import { useCallback, useMemo, useState, useEffect } from "react";
import { ApolloError, NetworkStatus } from "@apollo/client";
import { formatUnits } from "viem";

import {
  useVotingPowersQuery,
  QueryInput_VotingPowers_OrderBy,
  QueryInput_VotingPowers_OrderDirection,
  VotingPowersQuery,
} from "@anticapture/graphql-client/hooks";

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

export function useDelegateDelegationHistory(
  account: string,
  daoId: string,
  orderBy: "timestamp" | "delta" = "timestamp",
  orderDirection: "asc" | "desc" = "desc",
): UseDelegateDelegationHistoryResult {
  const itemsPerPage = 7;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPaginationLoading, setIsPaginationLoading] =
    useState<boolean>(false);

  // Reset page to 1 when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection]);

  const queryVariables = useMemo(
    () => ({
      account,
      limit: itemsPerPage,
      orderBy: orderBy as QueryInput_VotingPowers_OrderBy,
      orderDirection: orderDirection as QueryInput_VotingPowers_OrderDirection,
    }),
    [account, itemsPerPage, orderBy, orderDirection],
  );

  const queryOptions = {
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !account,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network" as const,
  };

  const { data, error, fetchMore, networkStatus } = useVotingPowersQuery({
    variables: queryVariables,
    ...queryOptions,
  });

  // Transform raw data to our format
  const transformedData = useMemo(() => {
    if (!data?.votingPowers?.items) return [];

    return data.votingPowers.items
      .filter((item) => !!item)
      .map((item) => {
        // Determine the type, action, and direction based on the data and delta
        let type: "delegation" | "transfer" = "delegation";
        let action = "Unknown";
        let isGain = false;

        // Parse delta to determine if it's a gain or loss
        // Convert from wei to token units using formatUnits (same as graph hook)
        const deltaValue = Number(formatUnits(BigInt(item.delta || "0"), 18));
        isGain = deltaValue > 0;

        if (item.delegation) {
          type = "delegation";
          // Check if delegate gains or loses voting power
          if (item.delegation.to === account) {
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
          delta: item.delta,
          delegation: item.delegation,
          transfer: item.transfer,
          votingPower: item.votingPower,
          type,
          action,
          isGain,
        };
      });
  }, [data, account]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (isPaginationLoading) return;
    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
        },
        updateQuery: (
          previousResult: VotingPowersQuery,
          { fetchMoreResult },
        ): VotingPowersQuery => {
          if (!fetchMoreResult) return previousResult;
          const prevItems = previousResult.votingPowers?.items ?? [];
          const newItems = fetchMoreResult.votingPowers?.items ?? [];
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
            votingPowers: {
              ...fetchMoreResult.votingPowers,
              items: merged,
              totalCount: fetchMoreResult.votingPowers?.totalCount ?? 0,
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
  }, [fetchMore, isPaginationLoading, queryVariables]);

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

  return {
    delegationHistory: transformedData,
    loading: networkStatus === NetworkStatus.loading,
    paginationInfo: {
      currentPage,
      totalPages: Math.ceil(data?.votingPowers?.totalCount || 0 / itemsPerPage),
      hasNextPage:
        currentPage * itemsPerPage < (data?.votingPowers?.totalCount || 0),
      hasPreviousPage: currentPage > 1,
    },
    error,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
  };
}
