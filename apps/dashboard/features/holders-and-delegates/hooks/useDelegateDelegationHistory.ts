import { useCallback, useMemo, useState, useEffect } from "react";
import { useGetDelegateDelegationHistoryQuery } from "@anticapture/graphql-client/hooks";
import { GetDelegateDelegationHistoryQuery } from "@anticapture/graphql-client";
import { ApolloError } from "@apollo/client";

type VotingPowerHistoryItem =
  GetDelegateDelegationHistoryQuery["votingPowerHistorys"]["items"][0];

// Interface for a single delegation history item
export interface DelegationHistoryItem {
  timestamp: string;
  transactionHash: string;
  delta: string; // Amount the selected address won or lost in votingPower
  delegation: {
    delegatorAccountId: string;
    delegatedValue: string;
    previousDelegate: string | null;
    delegateAccountId: string;
  } | null;
  transfer: {
    amount: string;
    fromAccountId: string;
    toAccountId: string;
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
  startCursor?: string | null;
  endCursor?: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  currentItemsCount: number;
}

// Interface for the hook result
export interface UseDelegateDelegationHistoryResult {
  delegationHistory: DelegationHistoryItem[];
  loading: boolean;
  error: ApolloError | undefined;
  paginationInfo: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
}

export function useDelegateDelegationHistory(
  accountId: string,
  daoId: string,
  orderBy: string = "timestamp",
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
      accountId,
      limit: itemsPerPage,
      orderBy, // Now using backend field names directly
      orderDirection,
    }),
    [accountId, itemsPerPage, orderBy, orderDirection],
  );

  const queryOptions = {
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !accountId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network" as const,
  };

  const { data, loading, error, fetchMore } =
    useGetDelegateDelegationHistoryQuery({
      variables: queryVariables,
      ...queryOptions,
    });

  // Transform raw data to our format
  const transformedData = useMemo(() => {
    if (!data?.votingPowerHistorys?.items) return [];

    return data.votingPowerHistorys.items.map(
      (item: VotingPowerHistoryItem) => {
        // Determine the type, action, and direction based on the data and delta
        let type: "delegation" | "transfer" = "delegation";
        let action = "Unknown";
        let isGain = false;

        // Parse delta to determine if it's a gain or loss
        const deltaValue = parseFloat(item.delta || "0");
        isGain = deltaValue > 0;

        if (item.delegation) {
          type = "delegation";
          // Check if delegate gains or loses voting power
          if (item.delegation.delegateAccountId === accountId) {
            // Delegate gains voting power - someone delegated to them
            action = `Received delegation from ${item.delegation.delegatorAccountId}`;
          } else {
            // Delegate loses voting power - delegator transferred delegation to someone else
            action = `Lost delegation from ${item.delegation.delegatorAccountId}`;
          }
        } else if (item.transfer) {
          type = "transfer";
          // For transfers, the selected address should always be at the delegates column
          // If delta is negative, fromAccountId should be at the delegator column
          // If delta is positive, toAccountId should be at the delegator column
          if (isGain) {
            action = `Received transfer from ${item.transfer.fromAccountId}`;
          } else {
            action = `Sent transfer to ${item.transfer.toAccountId}`;
          }
        }

        return {
          timestamp: item.timestamp?.toString() || "",
          transactionHash: item.transactionHash || "",
          delta: item.delta || "0",
          delegation: item.delegation
            ? {
                delegatorAccountId: item.delegation.delegatorAccountId || "",
                delegatedValue: item.delegation.delegatedValue || "0",
                previousDelegate: item.delegation.previousDelegate || null,
                delegateAccountId: item.delegation.delegateAccountId || "",
              }
            : null,
          transfer: item.transfer
            ? {
                amount: item.transfer.amount || "0",
                fromAccountId: item.transfer.fromAccountId || "",
                toAccountId: item.transfer.toAccountId || "",
              }
            : null,
          votingPower: item.votingPower || "0",
          type,
          action,
          isGain,
        };
      },
    );
  }, [data, accountId]);

  // Pagination info
  const paginationInfo: PaginationInfo = useMemo(() => {
    const pageInfo = data?.votingPowerHistorys?.pageInfo;
    const totalCount = data?.votingPowerHistorys?.totalCount || 0;
    const currentItemsCount = data?.votingPowerHistorys?.items?.length || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      hasNextPage: pageInfo?.hasNextPage ?? false,
      hasPreviousPage: pageInfo?.hasPreviousPage ?? false,
      endCursor: pageInfo?.endCursor,
      startCursor: pageInfo?.startCursor,
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount,
    };
  }, [
    data?.votingPowerHistorys?.pageInfo,
    data?.votingPowerHistorys?.totalCount,
    data?.votingPowerHistorys?.items?.length,
    currentPage,
    itemsPerPage,
  ]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (
      !paginationInfo.hasNextPage ||
      !paginationInfo.endCursor ||
      isPaginationLoading
    ) {
      console.warn("No next page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          after: paginationInfo.endCursor,
        },
        updateQuery: (
          previousResult: GetDelegateDelegationHistoryQuery,
          {
            fetchMoreResult,
          }: { fetchMoreResult: GetDelegateDelegationHistoryQuery },
        ) => {
          if (!fetchMoreResult) return previousResult;

          return {
            ...fetchMoreResult,
            votingPowerHistorys: {
              ...fetchMoreResult.votingPowerHistorys,
              items: fetchMoreResult.votingPowerHistorys.items,
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
    paginationInfo.hasNextPage,
    paginationInfo.endCursor,
    isPaginationLoading,
    queryVariables,
  ]);

  // Fetch previous page function
  const fetchPreviousPage = useCallback(async () => {
    if (
      !paginationInfo.hasPreviousPage ||
      !paginationInfo.startCursor ||
      isPaginationLoading
    ) {
      console.warn("No previous page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          before: paginationInfo.startCursor,
        },
        updateQuery: (
          previousResult: GetDelegateDelegationHistoryQuery,
          {
            fetchMoreResult,
          }: { fetchMoreResult: GetDelegateDelegationHistoryQuery },
        ) => {
          if (!fetchMoreResult) return previousResult;

          return {
            ...fetchMoreResult,
            votingPowerHistorys: {
              ...fetchMoreResult.votingPowerHistorys,
              items: fetchMoreResult.votingPowerHistorys.items,
            },
          };
        },
      });

      setCurrentPage((prev) => prev - 1);
    } catch (error) {
      console.error("Error fetching previous page:", error);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    paginationInfo.hasPreviousPage,
    paginationInfo.startCursor,
    isPaginationLoading,
    queryVariables,
  ]);

  return {
    delegationHistory: transformedData,
    loading,
    error,
    paginationInfo,
    fetchNextPage,
    fetchPreviousPage,
  };
}
