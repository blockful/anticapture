import {
  GetDelegatorVotingPowerDetailsQuery,
  GetDelegationsTimestampQuery,
  useGetDelegationsTimestampQuery,
  useGetDelegatorVotingPowerDetailsQuery,
  useGetVotingPowerCountingQuery,
  useGetTop5DelegatorsQuery,
  GetTop5DelegatorsQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { useState, useCallback, useMemo, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";

interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor?: string | null;
  startCursor?: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  currentItemsCount: number;
}

type DelegationItem =
  GetDelegationsTimestampQuery["delegations"]["items"][number];
type AccountBalanceBase =
  GetDelegatorVotingPowerDetailsQuery["accountBalances"]["items"][number];
type BalanceWithTimestamp = AccountBalanceBase & { timestamp?: any };

interface UseVotingPowerResult {
  top5Delegators: GetTop5DelegatorsQuery["accountBalances"]["items"] | null;
  delegatorsVotingPowerDetails: GetDelegatorVotingPowerDetailsQuery | null;
  votingPowerHistoryData: DelegationItem[];
  balances: BalanceWithTimestamp[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  fetchingMore: boolean;
  historicalDataLoading: boolean;
}
interface UseVotingPowerParams {
  daoId: DaoIdEnum;
  address: string;
  orderBy?: string;
  orderDirection?: string;
}

export const useVotingPower = ({
  daoId,
  address,
  orderBy = "balance",
  orderDirection = "desc",
}: UseVotingPowerParams): UseVotingPowerResult => {
  const itemsPerPage = 6;

  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // Reset to page 1 and refetch when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection]);

  // Main data query
  const {
    data: delegatorsVotingPowerDetails,
    loading,
    error,
    refetch,
    fetchMore,
    networkStatus,
  } = useGetDelegatorVotingPowerDetailsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      address,
      after: undefined,
      before: undefined,
      orderBy,
      orderDirection,
      limit: itemsPerPage,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  // Count query
  const { data: countingData } = useGetVotingPowerCountingQuery({
    variables: {
      address,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  // Refetch data when sorting changes to ensure we start from page 1
  useEffect(() => {
    refetch({
      after: undefined,
      before: undefined,
      orderBy,
      orderDirection,
    });
  }, [orderBy, orderDirection, refetch]);

  const accountBalances = delegatorsVotingPowerDetails?.accountBalances?.items;

  // ------------------------------------------------------------------
  // Prepare the array of delegator addresses once balances are fetched
  // ------------------------------------------------------------------
  const delegatorAddresses: string[] = accountBalances
    ? accountBalances.map((item) => item.accountId)
    : [];

  // ------------------------------------------------------------------
  // Fetch delegation timestamps (skipped until we have delegatorAddresses)
  // ------------------------------------------------------------------
  const {
    data: delegationsTimestampData,
    loading: tsLoading,
    error: tsError,
  } = useGetDelegationsTimestampQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      delegate: address,
      delegator: delegatorAddresses,
      daoId: daoId,
    },
    skip: delegatorAddresses.length === 0,
  });

  // ------------------------------------------------------------------
  // Build timestamp lookup <delegatorAccountId> -> timestamp
  // ------------------------------------------------------------------
  const timestampMap: Record<string, string | number | undefined> =
    Object.fromEntries(
      (delegationsTimestampData?.delegations.items || []).map((d) => [
        d.delegatorAccountId?.toLowerCase(),
        d.timestamp,
      ]),
    );

  // ------------------------------------------------------------------
  // Enrich balances with timestamp (fallback to undefined)
  // ------------------------------------------------------------------
  const balancesWithTimestamp = (accountBalances || []).map((ab) => ({
    ...ab,
    timestamp: timestampMap[ab.accountId.toLowerCase()],
  }));

  const { data: top5Delegators } = useGetTop5DelegatorsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      delegate: address,
      limit: 5,
    },
  });

  console.log("delegationsTimestampData", delegationsTimestampData);
  /* ------------------------------------------------------------------ */
  /* Pagination helpers                                                  */
  /* ------------------------------------------------------------------ */

  // Build pagination info combining GraphQL and local state
  const pagination = useMemo<PaginationInfo>(() => {
    const pageInfo = delegatorsVotingPowerDetails?.accountBalances?.pageInfo;
    const totalCount = countingData?.accountBalances?.totalCount || 0;
    const currentItemsCount =
      delegatorsVotingPowerDetails?.accountBalances?.items?.length || 0;
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
    delegatorsVotingPowerDetails?.accountBalances?.pageInfo,
    countingData?.accountBalances?.totalCount,
    delegatorsVotingPowerDetails?.accountBalances?.items?.length,
    currentPage,
    itemsPerPage,
  ]);

  // Next page
  const fetchNextPage = useCallback(async () => {
    if (
      !pagination.hasNextPage ||
      !pagination.endCursor ||
      isPaginationLoading
    ) {
      console.warn("No next page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          after: pagination.endCursor,
          before: undefined,
          orderBy,
          orderDirection,
        } as any,
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          return {
            ...fetchMoreResult,
            accountBalances: {
              ...fetchMoreResult.accountBalances,
              items: fetchMoreResult.accountBalances.items,
            },
          };
        },
      });

      setCurrentPage((prev) => prev + 1);
    } catch (err) {
      console.error("Error fetching next page:", err);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    pagination.endCursor,
    orderBy,
    orderDirection,
    isPaginationLoading,
  ]);

  // Previous page
  const fetchPreviousPage = useCallback(async () => {
    if (
      !pagination.hasPreviousPage ||
      !pagination.startCursor ||
      isPaginationLoading
    ) {
      console.warn("No previous page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      await fetchMore({
        variables: {
          after: undefined,
          before: pagination.startCursor,
          orderBy,
          orderDirection,
        } as any,
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          return {
            ...fetchMoreResult,
            accountBalances: {
              ...fetchMoreResult.accountBalances,
              items: fetchMoreResult.accountBalances.items,
            },
          };
        },
      });

      setCurrentPage((prev) => prev - 1);
    } catch (err) {
      console.error("Error fetching previous page:", err);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [
    fetchMore,
    pagination.hasPreviousPage,
    pagination.startCursor,
    orderBy,
    orderDirection,
    isPaginationLoading,
  ]);

  // Reset pagination on refetch
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  const top5DelegatorsWithBalance = top5Delegators?.accountBalances.items.map(
    (item) => ({
      ...item,
      balance: Number(BigInt(item.balance) / BigInt(10 ** 18)),
    }),
  );
  return {
    top5Delegators: top5DelegatorsWithBalance || null,
    delegatorsVotingPowerDetails: delegatorsVotingPowerDetails || null,
    votingPowerHistoryData: delegationsTimestampData?.delegations.items || [],
    balances: balancesWithTimestamp,
    loading: loading || tsLoading,
    error: error || tsError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
    historicalDataLoading: tsLoading,
  };
};
