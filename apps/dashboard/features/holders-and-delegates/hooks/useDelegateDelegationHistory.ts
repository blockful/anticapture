import { useCallback, useMemo, useState, useEffect } from "react";
import { useGetDelegateDelegationHistoryQuery } from "@anticapture/graphql-client/hooks";

// Interface for a single delegation history item
export interface DelegationHistoryItem {
  timestamp: string;
  transactionHash: string;
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
  error: any;
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
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // Reset page to 1 when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection]);

  const queryVariables = {
    accountId,
    limit: itemsPerPage,
    orderBy,
    orderDirection,
  };

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

    return data.votingPowerHistorys.items.map((item: any) => {
      // Determine the type, action, and direction based on the data
      let type: "delegation" | "transfer" = "delegation";
      let action = "Unknown";
      let isGain = false;

      if (item.delegation) {
        type = "delegation";
        // Check if delegate gains or loses voting power
        if (item.delegation.delegateAccountId === accountId) {
          // Delegate gains voting power - someone delegated to them
          isGain = true;
          action = `Received delegation from ${item.delegation.delegatorAccountId}`;
        } else {
          // Delegate loses voting power - delegator transferred delegation to someone else
          isGain = false;
          action = `Lost delegation from ${item.delegation.delegatorAccountId}`;
        }
      } else if (item.transfer) {
        type = "transfer";
        if (item.transfer.toAccountId === accountId) {
          // Delegate gains voting power - received transfer
          isGain = true;
          action = `Received transfer from ${item.transfer.fromAccountId}`;
        } else if (item.transfer.fromAccountId === accountId) {
          // Delegate loses voting power - sent transfer to someone else
          isGain = false;
          action = `Transferred to ${item.transfer.toAccountId}`;
        }
      }

      return {
        timestamp: item.timestamp?.toString() || "",
        transactionHash: item.transactionHash || "",
        delegation: item.delegation || null,
        transfer: item.transfer || null,
        votingPower: item.votingPower || "0",
        type,
        action,
        isGain,
      };
    });
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
          previousResult: any,
          { fetchMoreResult }: { fetchMoreResult: any },
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
          previousResult: any,
          { fetchMoreResult }: { fetchMoreResult: any },
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
