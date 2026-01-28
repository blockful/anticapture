import {
  GetDelegatorVotingPowerDetailsQuery,
  GetDelegationsTimestampQuery,
  useGetDelegationsTimestampQuery,
  useGetDelegatorVotingPowerDetailsQuery,
  useGetTopFiveDelegatorsQuery,
  GetTopFiveDelegatorsQuery,
} from "@anticapture/graphql-client/hooks";
import { QueryInput_AccountBalances_OrderDirection } from "@anticapture/graphql-client";
import { DaoIdEnum } from "@/shared/types/daos";
import { useState, useCallback, useMemo, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import daoConfig from "@/shared/dao-config";

interface PaginationInfo {
  hasNextPage: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  currentItemsCount: number;
}

type DelegationItem = NonNullable<
  NonNullable<GetDelegationsTimestampQuery["delegations"]>["items"][number]
>;
type AccountBalanceBase = NonNullable<
  NonNullable<
    GetDelegatorVotingPowerDetailsQuery["accountBalances"]
  >["items"][number]
>;
type BalanceWithTimestamp = AccountBalanceBase & {
  timestamp?: string | number;
};

type TopFiveDelegatorsWithBalance = Omit<
  NonNullable<
    NonNullable<GetTopFiveDelegatorsQuery["accountBalances"]>["items"][number]
  >,
  "balance"
> & {
  balance: number;
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
  fetchingMore: boolean;
  historicalDataLoading: boolean;
  totalCount: number;
}
interface UseVotingPowerParams {
  daoId: DaoIdEnum;
  address: string;
  orderBy?: string;
  orderDirection?: QueryInput_AccountBalances_OrderDirection;
}

export const useVotingPower = ({
  daoId,
  address,
  orderBy = "balance",
  orderDirection = QueryInput_AccountBalances_OrderDirection.Desc,
}: UseVotingPowerParams): UseVotingPowerResult => {
  const itemsPerPage = 10;
  const {
    daoOverview: { token },
  } = daoConfig[daoId];

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
      addresses: [address],
      address,
      orderDirection,
      limit: itemsPerPage,
      skip: 0,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  // Refetch data when sorting changes to ensure we start from page 1
  useEffect(() => {
    refetch({
      addresses: [address],
      address,
      orderDirection,
      limit: itemsPerPage,
      skip: 0,
    });
  }, [orderBy, orderDirection, refetch, itemsPerPage, address]);

  const accountBalances = delegatorsVotingPowerDetails?.accountBalances?.items;

  // ------------------------------------------------------------------
  // Fetch delegation timestamps for all delegators TO this delegate
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
    },
    skip: !address,
  });

  useEffect(() => {
    if (delegationsTimestampData?.delegations?.items) {
      setAllDelegations(
        delegationsTimestampData.delegations.items.filter(
          (d): d is NonNullable<typeof d> => d !== null,
        ),
      );
    }
  }, [delegationsTimestampData]);

  const timestampMap = Object.fromEntries(
    allDelegations.map((d) => [d.delegatorAddress?.toLowerCase(), d.timestamp]),
  );

  // ------------------------------------------------------------------
  // Enrich balances with timestamp (fallback to undefined)
  // ------------------------------------------------------------------
  const balancesWithTimestamp = (accountBalances || [])
    .filter((account) => account !== null)
    .map((account) => ({
      ...account,
      timestamp: timestampMap[account.accountId.toLowerCase()],
    }));

  // Fetch top 5 delegators
  const { data: topFiveDelegators } = useGetTopFiveDelegatorsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      delegates: [address],
      limit: 5,
    },
  });

  /* ------------------------------------------------------------------ */
  /* Pagination helpers                                                  */
  /* ------------------------------------------------------------------ */

  // Build pagination info combining GraphQL and local state
  const pagination = useMemo<PaginationInfo>(() => {
    const totalCount =
      delegatorsVotingPowerDetails?.accountBalances?.totalCount || 0;
    const currentItemsCount =
      delegatorsVotingPowerDetails?.accountBalances?.items?.length || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      totalCount,
      currentPage,
      totalPages,
      itemsPerPage,
      currentItemsCount,
    };
  }, [
    delegatorsVotingPowerDetails?.accountBalances?.totalCount,
    delegatorsVotingPowerDetails?.accountBalances?.items?.length,
    currentPage,
    itemsPerPage,
  ]);

  // Next page
  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isPaginationLoading) {
      console.warn("No next page available or already loading");
      return;
    }

    setIsPaginationLoading(true);

    try {
      // Calculate skip based on current loaded items count
      const currentItemsCount =
        delegatorsVotingPowerDetails?.accountBalances?.items?.length || 0;
      const skip = currentItemsCount;

      await fetchMore({
        variables: {
          skip,
          orderBy,
          orderDirection,
          limit: itemsPerPage,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult?.accountBalances) return previousResult;
          const prevItems = previousResult.accountBalances?.items ?? [];
          const newItems = fetchMoreResult.accountBalances.items ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) => n && !prevItems.some((p) => p?.accountId === n.accountId),
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
    orderBy,
    orderDirection,
    isPaginationLoading,
    itemsPerPage,
    delegatorsVotingPowerDetails?.accountBalances?.items?.length,
  ]);

  // Reset pagination on refetch
  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  const topDelegatorsItems = topFiveDelegators?.accountBalances?.items
    ?.filter((item) => item !== null)
    .map((item) => ({
      ...item,
      balance:
        token === "ERC20"
          ? Number(BigInt(item.balance) / BigInt(10 ** 18))
          : Number(item.balance),
      rawBalance: BigInt(item.balance),
    }));

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
    votingPowerHistoryData:
      delegationsTimestampData?.delegations?.items?.filter(
        (item): item is NonNullable<typeof item> => item !== null,
      ) || [],
    balances: balancesWithTimestamp,
    loading: isLoading,
    error: error || tsError || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchingMore:
      networkStatus === NetworkStatus.fetchMore || isPaginationLoading,
    historicalDataLoading: tsLoading,
    totalCount: delegatorsVotingPowerDetails?.accountBalances?.totalCount || 0,
  };
};
