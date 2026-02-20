"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetFeedEventsQuery,
  QueryInput_FeedEvents_OrderDirection,
  QueryInput_FeedEvents_OrderBy,
  QueryInput_FeedEvents_Relevance,
  QueryInput_FeedEvents_Type,
  useGetFeedEventsQuery,
} from "@anticapture/graphql-client/hooks";
import { ActivityFeedFilters, FeedEventType } from "@/features/feed/types";

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const queryVariables = useMemo(
    () => ({
      skip: 0,
      limit,
      orderBy: QueryInput_FeedEvents_OrderBy.Timestamp,
      orderDirection:
        filters.sortOrder === "asc"
          ? QueryInput_FeedEvents_OrderDirection.Asc
          : QueryInput_FeedEvents_OrderDirection.Desc,
      relevance: filters.relevance as unknown as
        | QueryInput_FeedEvents_Relevance
        | undefined,
      type: filters.type as unknown as QueryInput_FeedEvents_Type | undefined,
      fromDate: filters.fromTimestamp,
      toDate: filters.toTimestamp,
    }),
    [
      limit,
      filters.sortOrder,
      filters.relevance,
      filters.type,
      filters.fromTimestamp,
      filters.toTimestamp,
    ],
  );

  const { data, loading, error, fetchMore, refetch } = useGetFeedEventsQuery({
    variables: queryVariables,
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  const totalCount = data?.feedEvents?.totalCount ?? 0;

  const pagination: PaginationInfo = useMemo(
    () => ({
      totalCount,
      hasNextPage: (data?.feedEvents?.items?.length ?? 0) < totalCount,
      hasPreviousPage: false,
      currentPage:
        Math.ceil((data?.feedEvents?.items?.length ?? 0) / limit) || 1,
      itemsPerPage: limit,
    }),
    [totalCount, data?.feedEvents?.items?.length, limit],
  );

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          skip: data?.feedEvents?.items?.length ?? 0,
        },
        updateQuery: (
          previousResult: GetFeedEventsQuery,
          { fetchMoreResult }: { fetchMoreResult: GetFeedEventsQuery },
        ) => {
          if (!fetchMoreResult?.feedEvents?.items?.length) {
            return previousResult;
          }

          return {
            ...fetchMoreResult,
            feedEvents: {
              ...fetchMoreResult.feedEvents,
              items: [
                ...(previousResult.feedEvents?.items ?? []),
                ...(fetchMoreResult.feedEvents.items ?? []),
              ],
            },
          };
        },
      });
    } catch (err) {
      console.error("Error fetching next page:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    fetchMore,
    pagination.hasNextPage,
    isLoadingMore,
    queryVariables,
    data?.feedEvents?.items?.length,
  ]);

  return {
    data: data?.feedEvents?.items.filter((item) => item !== null) ?? [],
    totalCount,
    loading,
    error,
    refetch,
    pagination,
    fetchNextPage,
    isLoadingMore,
  };
};
