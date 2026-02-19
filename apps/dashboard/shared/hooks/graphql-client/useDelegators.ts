import {
  GetDelegatorsQuery,
  useGetDelegatorsQuery,
} from "@anticapture/graphql-client/hooks";
import {
  QueryInput_Delegators_OrderBy,
  QueryInput_Delegators_OrderDirection,
} from "@anticapture/graphql-client";
import { DaoIdEnum } from "@/shared/types/daos";
import { useState, useCallback, useMemo, useEffect } from "react";

interface PaginationInfo {
  hasNextPage: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  currentItemsCount: number;
}

export type DelegatorItem = NonNullable<
  NonNullable<GetDelegatorsQuery["delegators"]>["items"][number]
>;

interface UseDelegatorsResult {
  delegators: DelegatorItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: PaginationInfo;
  fetchNextPage: () => Promise<void>;
  fetchingMore: boolean;
  totalCount: number;
}

interface UseVotingPowerParams {
  daoId: DaoIdEnum;
  address: string;
  orderBy?: QueryInput_Delegators_OrderBy;
  orderDirection?: QueryInput_Delegators_OrderDirection;
  limit?: number;
}

export const useDelegators = ({
  daoId,
  address,
  orderBy = QueryInput_Delegators_OrderBy.Amount,
  orderDirection = QueryInput_Delegators_OrderDirection.Desc,
  limit = 15,
}: UseVotingPowerParams): UseDelegatorsResult => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPaginationLoading, setIsPaginationLoading] =
    useState<boolean>(false);

  const [delegators, delegatorsSet] = useState<DelegatorItem[]>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [orderBy, orderDirection]);

  const {
    data,
    error,
    refetch: refetchDelegators,
    fetchMore,
    loading,
  } = useGetDelegatorsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      address,
      orderBy,
      orderDirection,
      limit,
      skip: 0,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  console.log({ data });

  useEffect(() => {
    delegatorsSet(() => data?.delegators?.items.filter((item) => !!item) ?? []);
  }, [data?.delegators?.items]);

  useEffect(() => {
    refetchDelegators({
      address,
      orderBy,
      orderDirection,
      limit,
      skip: 0,
    });
  }, [orderBy, orderDirection, refetchDelegators, limit, address]);

  const pagination = useMemo<PaginationInfo>(() => {
    const totalCount = data?.delegators?.totalCount || 0;
    const currentItemsCount = data?.delegators?.items?.length || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      hasNextPage: currentPage < totalPages,
      totalCount,
      currentPage,
      totalPages,
      limit,
      currentItemsCount,
    };
  }, [
    data?.delegators?.totalCount,
    data?.delegators?.items?.length,
    currentPage,
    limit,
  ]);

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isPaginationLoading) {
      return;
    }

    setIsPaginationLoading(true);

    try {
      const currentItemsCount = data?.delegators?.items?.length || 0;
      const skip = currentItemsCount;

      await fetchMore({
        variables: {
          skip,
          orderBy,
          orderDirection,
          limit,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult?.delegators) return previousResult;
          const prevItems = previousResult.delegators?.items ?? [];
          const newItems = fetchMoreResult.delegators.items ?? [];
          const merged = [
            ...prevItems,
            ...newItems.filter(
              (n) =>
                n &&
                !prevItems.some(
                  (p) => p?.delegatorAddress === n.delegatorAddress,
                ),
            ),
          ];

          return {
            ...fetchMoreResult,
            delegators: {
              ...fetchMoreResult.delegators,
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
    limit,
    data?.delegators?.items?.length,
  ]);

  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetchDelegators();
  }, [refetchDelegators]);

  return {
    delegators,
    loading,
    error: error || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchingMore: isPaginationLoading,
    totalCount: data?.delegators?.totalCount || 0,
  };
};
