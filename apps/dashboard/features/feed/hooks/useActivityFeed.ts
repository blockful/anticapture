import type { FeedEventsPathParams } from "@anticapture/client";
import {
  type FeedEventsQueryParams,
  getNextPageParam,
} from "@anticapture/client";
import { useFeedEventsInfinite } from "@anticapture/client/hooks";

import { groupFeedEventsByDate } from "@/shared/utils/groupFeedEventsByDate";

export const useActivityFeed = ({
  daoId,
  filters,
}: {
  daoId: string;
  filters: FeedEventsQueryParams;
}) => {
  const {
    data,
    isLoading,
    fetchNextPage,
    error,
    hasNextPage,
    hasPreviousPage,
    refetch,
    isFetching,
  } = useFeedEventsInfinite(
    daoId as FeedEventsPathParams["dao"],
    {
      limit: filters.limit,
      orderBy: filters.orderBy,
      orderDirection: filters.orderDirection,
      relevance: filters.relevance ?? undefined,
      type: filters.type ?? undefined,
      fromDate: filters.fromDate ?? undefined,
      toDate: filters.toDate ?? undefined,
    },
    {
      query: {
        getNextPageParam,
      },
    },
  );

  const events = data?.pages ? data.pages.flatMap((page) => page.items) : [];
  const groupedEvents = groupFeedEventsByDate(events, filters.orderDirection);

  const hasEvents = groupedEvents.length > 0;
  const loading = isLoading && !hasEvents;
  return {
    data: groupedEvents,
    loading: isLoading || isFetching,
    error: !loading && Boolean(error),
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    refetch,
  };
};
