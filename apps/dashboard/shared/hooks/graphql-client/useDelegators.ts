import type {
  DelegatorItem as RestDelegatorItem,
  DelegatorsPathParamsDaoEnumKey,
  DelegatorsQueryParamsOrderByEnumKey,
  DelegatorsQueryResponse,
  OrderDirection,
} from "@anticapture/client";
import { useDelegatorsInfinite } from "@anticapture/client/hooks";
import { useCallback, useMemo } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";

interface PaginationInfo {
  hasNextPage: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  currentItemsCount: number;
}

export type DelegatorItem = RestDelegatorItem;

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
  orderBy?: DelegatorsQueryParamsOrderByEnumKey;
  orderDirection?: OrderDirection;
  limit?: number;
}

const getNextPageParam = (
  lastPage: DelegatorsQueryResponse,
  allPages: DelegatorsQueryResponse[],
): number | undefined => {
  const loaded = allPages.reduce((s, p) => s + p.items.length, 0);
  return loaded >= lastPage.totalCount ? undefined : loaded;
};

export const useDelegators = ({
  daoId,
  address,
  orderBy = "amount",
  orderDirection = "desc",
  limit = 15,
}: UseVotingPowerParams): UseDelegatorsResult => {
  const {
    data,
    isLoading,
    error,
    refetch: refetchDelegators,
    fetchNextPage: fetchNextDelegatorsPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDelegatorsInfinite(
    daoId.toLowerCase() as DelegatorsPathParamsDaoEnumKey,
    address,
    {
      orderBy,
      orderDirection,
      limit,
    },
    { query: { getNextPageParam } },
  );

  const pagination = useMemo<PaginationInfo>(() => {
    const totalCount = data?.pages[0]?.totalCount || 0;
    const currentItemsCount =
      data?.pages.reduce((s, p) => s + p.items.length, 0) || 0;
    const currentPage = data?.pages.length || 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      hasNextPage: hasNextPage ?? false,
      totalCount,
      currentPage,
      totalPages,
      limit,
      currentItemsCount,
    };
  }, [data?.pages, hasNextPage, limit]);

  const delegators = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isFetchingNextPage) {
      return;
    }

    await fetchNextDelegatorsPage();
  }, [fetchNextDelegatorsPage, pagination.hasNextPage, isFetchingNextPage]);

  const handleRefetch = useCallback(() => {
    void refetchDelegators();
  }, [refetchDelegators]);

  return {
    delegators,
    loading: isLoading,
    error: error || null,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchingMore: isFetchingNextPage,
    totalCount: data?.pages[0]?.totalCount || 0,
  };
};
