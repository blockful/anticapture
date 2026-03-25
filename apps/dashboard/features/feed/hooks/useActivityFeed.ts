"use client";

import {
  FeedEventType,
  FeedRelevance,
  OrderDirection,
  QueryInput_FeedEvents_OrderBy,
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

const ALL_FEED_EVENT_TYPES: FeedEventType[] = [
  FeedEventType.Vote,
  FeedEventType.Proposal,
  FeedEventType.ProposalExtended,
  FeedEventType.Transfer,
  FeedEventType.Delegation,
];

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

  const queryVariables = useMemo(
    () => ({
      skip: 0,
      limit: requestedLimit,
      orderBy: QueryInput_FeedEvents_OrderBy.Timestamp,
      orderDirection:
        filters.sortOrder === "asc" ? OrderDirection.Asc : OrderDirection.Desc,
      relevance: filters.relevance ?? FeedRelevance.Medium,
      fromDate: filters.fromTimestamp,
      toDate: filters.toTimestamp,
    }),
    [
      requestedLimit,
      filters.sortOrder,
      filters.relevance,
      filters.fromTimestamp,
      filters.toTimestamp,
    ],
  );

  const voteQuery = useGetFeedEventsQuery({
    variables: { ...queryVariables, type: FeedEventType.Vote },
    skip: !enabled || (!!filters.type && filters.type !== FeedEventType.Vote),
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  const proposalQuery = useGetFeedEventsQuery({
    variables: { ...queryVariables, type: FeedEventType.Proposal },
    skip:
      !enabled || (!!filters.type && filters.type !== FeedEventType.Proposal),
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  const proposalExtendedQuery = useGetFeedEventsQuery({
    variables: { ...queryVariables, type: FeedEventType.ProposalExtended },
    skip:
      !enabled ||
      (!!filters.type && filters.type !== FeedEventType.ProposalExtended),
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  const transferQuery = useGetFeedEventsQuery({
    variables: { ...queryVariables, type: FeedEventType.Transfer },
    skip:
      !enabled || (!!filters.type && filters.type !== FeedEventType.Transfer),
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  const delegationQuery = useGetFeedEventsQuery({
    variables: { ...queryVariables, type: FeedEventType.Delegation },
    skip:
      !enabled || (!!filters.type && filters.type !== FeedEventType.Delegation),
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  });

  const activeQueries = useMemo(
    () =>
      [
        { type: FeedEventType.Vote, query: voteQuery },
        { type: FeedEventType.Proposal, query: proposalQuery },
        {
          type: FeedEventType.ProposalExtended,
          query: proposalExtendedQuery,
        },
        { type: FeedEventType.Transfer, query: transferQuery },
        { type: FeedEventType.Delegation, query: delegationQuery },
      ].filter(({ type }) => !filters.type || filters.type === type),
    [
      filters.type,
      voteQuery,
      proposalQuery,
      proposalExtendedQuery,
      transferQuery,
      delegationQuery,
    ],
  );

  const loading = activeQueries.some(({ query }) => query.loading);
  const isLoadingMore = loading && currentPage > 1;
  const error =
    activeQueries.find(({ query }) => query.error)?.query.error ?? undefined;

  const data = useMemo(() => {
    const items = activeQueries.flatMap(
      ({ query }) =>
        (query.data?.feedEvents?.items.filter(
          (item): item is FeedEvent => item !== null,
        ) as FeedEvent[]) ?? [],
    );

    return items
      .sort((a, b) => {
        if (filters.sortOrder === "asc") {
          return a.timestamp - b.timestamp || a.logIndex - b.logIndex;
        }
        return b.timestamp - a.timestamp || b.logIndex - a.logIndex;
      })
      .slice(0, requestedLimit);
  }, [activeQueries, filters.sortOrder, requestedLimit]);

  const totalCount = useMemo(
    () =>
      activeQueries.reduce(
        (sum, { query }) => sum + (query.data?.feedEvents?.totalCount ?? 0),
        0,
      ),
    [activeQueries],
  );

  const refetch = useCallback(async () => {
    const selectedTypes = filters.type ? [filters.type] : ALL_FEED_EVENT_TYPES;
    await Promise.all(
      selectedTypes.map((type) => {
        const activeQuery = activeQueries.find(
          ({ type: activeType }) => activeType === type,
        )?.query;
        return activeQuery?.refetch({ ...queryVariables, type });
      }),
    );
  }, [activeQueries, filters.type, queryVariables]);

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
