import {
  GetDelegatorVotingPowerDetailsQuery,
  GetDelegationsTimestampQuery,
  useGetDelegationsTimestampQuery,
  useGetDelegatorVotingPowerDetailsQuery,
  useGetVotingPowerCountingQuery,
  useGetTopFiveDelegatorsQuery,
  GetTopFiveDelegatorsQuery,
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
type BalanceWithTimestamp = AccountBalanceBase & {
  timestamp?: string | number;
};

type TopFiveDelegatorsWithBalance =
  GetTopFiveDelegatorsQuery["accountBalances"]["items"][number] & {
    rawBalance: bigint;
  };

interface UseVotingPowerResult {
  topFiveDelegators: TopFiveDelegatorsWithBalance[] | null;
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
  totalCount: number;
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
  const itemsPerPage = 10;

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPaginationLoading, setIsPaginationLoading] =
    useState<boolean>(false);
  const [allDelegations, setAllDelegations] = useState<DelegationItem[]>([]);

  // Reset to page 1 when sorting changes (new query)
  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection]);

  // Main data query
  const {
    data: delegatorsVotingPowerDetails,
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

  console.log("Counting data:", countingData);

  // Refetch data when sorting changes to ensure we start from page 1
  useEffect(() => {
    refetch({
      after: undefined,
      before: undefined,
      orderBy,
      orderDirection,
      limit: itemsPerPage,
    });
  }, [orderBy, orderDirection, refetch, itemsPerPage]);

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
  useEffect(() => {
    if (delegationsTimestampData?.delegations.items) {
      setAllDelegations((prev) => {
        const merged = [
          ...prev,
          ...delegationsTimestampData.delegations.items.filter(
            (d) =>
              !prev.some((p) => p.delegatorAccountId === d.delegatorAccountId),
          ),
        ];
        return merged;
      });
    }
  }, [delegationsTimestampData]);

  const timestampMap = Object.fromEntries(
    allDelegations.map((d) => [
      d.delegatorAccountId?.toLowerCase(),
      d.timestamp,
    ]),
  );

  // ------------------------------------------------------------------
  // Enrich balances with timestamp (fallback to undefined)
  // ------------------------------------------------------------------
  const balancesWithTimestamp = (accountBalances || []).map((account) => ({
    ...account,
    timestamp: timestampMap[account.accountId.toLowerCase()],
  }));

  const { data: topFiveDelegators } = useGetTopFiveDelegatorsQuery({
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
          limit: itemsPerPage,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;
          const prevItems = previousResult.accountBalances.items ?? [];
          const newItems = fetchMoreResult.accountBalances.items ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) => !prevItems.some((p) => p.accountId === n.accountId),
            ),
          ];

          return {
            ...fetchMoreResult,
            accountBalances: {
              ...fetchMoreResult.accountBalances,
              items: merged,
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
    itemsPerPage,
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
          limit: itemsPerPage,
        },
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
    itemsPerPage,
  ]);

  // Reset pagination on refetch
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  const topDelegatorsItems = topFiveDelegators?.accountBalances.items?.map(
    (item) => ({
      ...item,
      balance: Number(BigInt(item.balance) / BigInt(10 ** 18)),
      rawBalance: BigInt(item.balance),
    }),
  );

  const isLoading = useMemo(() => {
    return (
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.refetch
    );
  }, [networkStatus]);

  return {
    topFiveDelegators: topDelegatorsItems || null,
    delegatorsVotingPowerDetails: delegatorsVotingPowerDetails || null,
    votingPowerHistoryData: delegationsTimestampData?.delegations.items || [],
    balances: balancesWithTimestamp,
    loading: isLoading,
    error: error || tsError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
    historicalDataLoading: tsLoading,
    totalCount: countingData?.accountBalances.totalCount || 0,
  };
};
