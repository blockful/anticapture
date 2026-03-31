"use client";

import {
  OrderDirection,
  QueryInput_FeedEvents_OrderBy,
  QueryInput_FeedEvents_Relevance,
  type QueryInput_FeedEvents_Type,
  useGetFeedEventsQuery,
} from "@anticapture/graphql-client/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ActivityFeedFilters, FeedEvent } from "@/features/feed/types";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

interface UseActivityFeedParams {
  daoId: DaoIdEnum;
  filters?: ActivityFeedFilters;
  enabled?: boolean;
}

interface PaginationInfo {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  itemsPerPage: number;
}

export const useActivityFeed = ({
  daoId,
  filters = {},
  enabled = true,
}: UseActivityFeedParams) => {
  const limit = filters.limit ?? 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    limit,
    filters.sortOrder,
    filters.relevance,
    filters.type,
    filters.fromTimestamp,
    filters.toTimestamp,
  ]);

  const requestedLimit = limit * currentPage;

  const {
    data: queryData,
    loading,
    error,
    refetch,
  } = useGetFeedEventsQuery({
    variables: {
      skip: 0,
      limit: requestedLimit,
      orderBy: QueryInput_FeedEvents_OrderBy.Timestamp,
      orderDirection:
        filters.sortOrder === "asc" ? OrderDirection.Asc : OrderDirection.Desc,
      relevance:
        (filters.relevance as unknown as QueryInput_FeedEvents_Relevance) ??
        QueryInput_FeedEvents_Relevance.Medium,
      type: (filters.type as unknown as QueryInput_FeedEvents_Type) ?? null,
      fromDate: filters.fromTimestamp ?? null,
      toDate: filters.toTimestamp ?? null,
    },
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  const isLoadingMore = loading && currentPage > 1;

  const data = useMemo(() => {
    const items =
      (queryData?.feedEvents?.items.filter(
        (item): item is NonNullable<typeof item> => item !== null,
      ) as unknown as FeedEvent[]) ?? [];

    return items.slice(0, requestedLimit);
  }, [queryData, requestedLimit]);

  const totalCount = queryData?.feedEvents?.totalCount ?? 0;

  const fetchNextPage = useCallback(async () => {
    if (loading || data.length >= totalCount) return;

    setCurrentPage((page) => page + 1);
  }, [loading, data.length, totalCount]);

  const pagination: PaginationInfo = useMemo(
    () => ({
      totalCount,
      hasNextPage: data.length < totalCount,
      hasPreviousPage: currentPage > 1,
      currentPage,
      itemsPerPage: limit,
    }),
    [totalCount, data.length, currentPage, limit],
  );

  return {
    data,
    totalCount,
    loading,
    error,
    refetch,
    pagination,
    fetchNextPage,
    isLoadingMore,
  };
};
