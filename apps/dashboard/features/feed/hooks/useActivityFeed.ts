"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetFeedEventsQuery,
  QueryInput_FeedEvents_OrderDirection,
  QueryInput_FeedEvents_OrderBy,
  QueryInput_FeedEvents_Relevance,
  QueryInput_FeedEvents_Type,
  Query_FeedEvents_Items_Items_Relevance,
  useGetFeedEventsQuery,
} from "@anticapture/graphql-client/hooks";
import {
  ActivityFeedFilters,
  FeedEvent,
  // FeedEventRelevance,
  // FeedEventType,
} from "@/features/feed/types";

// const mapRelevance = (
//   relevance: Query_FeedEvents_Items_Items_Relevance,
// ): FeedEventRelevance => {
//   switch (relevance) {
//     case Query_FeedEvents_Items_Items_Relevance.High:
//       return "high";
//     case Query_FeedEvents_Items_Items_Relevance.Medium:
//       return "medium";
//     case Query_FeedEvents_Items_Items_Relevance.Low:
//       return "low";
//     default:
//       return "none";
//   }
// };

// const mapType = (type: string): FeedEventType => {
//   switch (type) {
//     case "VOTE":
//       return "vote";
//     case "PROPOSAL":
//     case "PROPOSAL_EXTENDED":
//       return "proposal";
//     case "TRANSFER":
//       return "transfer";
//     case "DELEGATION":
//     case "DELEGATION_VOTES_CHANGED":
//       return "delegation";
//     default:
//       return "vote";
//   }
// };

// const mapTypeFilter = (
//   types?: QueryInput_FeedEvents_Type[],
// ): QueryInput_FeedEvents_Type | undefined => {
//   if (!types || types.length === 0) return undefined;
//   switch (types[0]) {
//     case "vote":
//       return QueryInput_FeedEvents_Type.Vote;
//     case "proposal":
//       return QueryInput_FeedEvents_Type.Proposal;
//     case "transfer":
//       return QueryInput_FeedEvents_Type.Transfer;
//     case "delegation":
//       return QueryInput_FeedEvents_Type.Delegation;
//     default:
//       return undefined;
//   }
// };

// const mapRelevanceFilter = (
//   relevances?: FeedEventRelevance[],
// ): QueryInput_FeedEvents_Relevance | undefined => {
//   if (!relevances || relevances.length === 0) return undefined;
//   switch (relevances[0]) {
//     case "high":
//       return QueryInput_FeedEvents_Relevance.High;
//     case "medium":
//       return QueryInput_FeedEvents_Relevance.Medium;
//     case "low":
//       return QueryInput_FeedEvents_Relevance.Low;
//     default:
//       return undefined;
//   }
// };

// type RawFeedItem = NonNullable<
//   NonNullable<GetFeedEventsQuery["feedEvents"]>["items"][number]
// >;

// const transformFeedEvent = (item: RawFeedItem): FeedEvent => {
//   const type = mapType(item.type);
//   const metadata = item.metadata ?? {};

//   return {
//     txHash: item.txHash,
//     logIndex: item.logIndex,
//     timestamp: String(item.timestamp),
//     relevance: mapRelevance(item.relevance),
//     type,
//     ...(type === "vote" && { vote: metadata }),
//     ...(type === "proposal" && { proposal: metadata }),
//     ...(type === "transfer" && { transfer: metadata }),
//     ...(type === "delegation" && { delegation: metadata }),
//   };
// };

// const getEventKey = (event: FeedEvent): string =>
//   `${event.txHash}-${event.logIndex}`;

// const deduplicateEvents = (events: FeedEvent[]): FeedEvent[] => {
//   const seen = new Set<string>();
//   return events.filter((event) => {
//     const key = getEventKey(event);
//     if (seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });
// };

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
  const limit = filters.limit ?? 20;
  const [allItems, setAllItems] = useState<FeedEvent[]>([]);
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
      // type: mapTypeFilter(filters.types),
      // relevance: mapRelevanceFilter(filters.relevances),
      fromDate: filters.fromTimestamp,
      toDate: filters.toTimestamp,
    }),
    [
      limit,
      filters.sortOrder,
      // filters.types,
      // filters.relevances,
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

  console.log({ data });

  // useEffect(() => {
  // const rawItems = data?.feedEvents?.items ?? [];
  // const events = rawItems
  //   .filter((item) => item !== null)
  //   .map(transformFeedEvent);
  // setAllItems(deduplicateEvents(events));
  //   setAllItems(data?.feedEvents?.items ?? []);
  // }, [data]);

  const totalCount = data?.feedEvents?.totalCount ?? 0;

  const pagination: PaginationInfo = useMemo(
    () => ({
      totalCount,
      hasNextPage: allItems.length < totalCount,
      hasPreviousPage: false,
      currentPage: Math.ceil(allItems.length / limit) || 1,
      itemsPerPage: limit,
    }),
    [totalCount, allItems.length, limit],
  );

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      await fetchMore({
        variables: {
          ...queryVariables,
          skip: allItems.length,
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
    allItems.length,
  ]);

  // const refetch = useCallback(() => {
  //   setAllItems([]);
  //   apolloRefetch();
  // }, [apolloRefetch]);

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
