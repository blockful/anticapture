import type { FeedEventsPathParams } from "@anticapture/client";
import {
  type FeedItem,
  type FeedEventsQueryParams,
  getNextPageParam,
} from "@anticapture/client";
import { useFeedEventsInfinite } from "@anticapture/client/hooks";

export const useActivityFeed = ({
  daoId,
  filters,
}: {
  daoId: FeedEventsPathParams["dao"];
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
    daoId,
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
  const groupedEvents = groupEventsByDate(events, filters.orderDirection);

  return {
    data: groupedEvents,
    loading: isLoading || isFetching,
    error: error || !data,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    refetch,
  };
};

// Helper to get local date key (YYYY-MM-DD in local timezone)
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to group events by date
const groupEventsByDate = (
  events: FeedItem[],
  sortOrder: "asc" | "desc" = "desc",
) => {
  const groups: {
    label: string;
    date: string;
    events: FeedItem[];
    highRelevanceCount: number;
  }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const currentYear = today.getFullYear();

  const todayKey = getLocalDateKey(today);
  const yesterdayKey = getLocalDateKey(yesterday);

  const eventsByDate = new Map<string, FeedItem[]>();

  events.forEach((event) => {
    const eventDate = new Date(Number(event.timestamp) * 1000);
    const dateKey = getLocalDateKey(eventDate);

    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  // Sort dates to match the selected sort order
  const sortedDates = Array.from(eventsByDate.keys()).sort((a, b) =>
    sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a),
  );

  sortedDates.forEach((dateKey) => {
    const dateEvents = eventsByDate.get(dateKey)!;
    // Parse the local date key back to a date at midnight local time
    const [year, month, day] = dateKey.split("-").map(Number);
    const eventDate = new Date(year, month - 1, day);
    const isCurrentYear = year === currentYear;

    let label: string;
    if (dateKey === todayKey) {
      label = "TODAY";
    } else if (dateKey === yesterdayKey) {
      label = "YESTERDAY";
    } else {
      const formatOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        month: "short",
        day: "numeric",
        ...(isCurrentYear ? {} : { year: "numeric" }),
      };
      label = eventDate
        .toLocaleDateString("en-US", formatOptions)
        .toUpperCase();
    }

    const highRelevanceCount = dateEvents.filter(
      (e) => e.relevance === "HIGH",
    ).length;

    groups.push({
      label,
      date: dateKey,
      events: dateEvents,
      highRelevanceCount,
    });
  });

  return groups;
};
