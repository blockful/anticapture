import { useCallback } from "react";
import {
  useQueryState,
  parseAsStringEnum,
  parseAsInteger,
  parseAsArrayOf,
} from "nuqs";

import {
  type FeedEventsQueryParams,
  type OrderDirection,
  type FeedRelevance,
  type FeedEventType,
  feedRelevanceEnum,
  feedEventTypeEnum,
  orderDirectionEnum,
} from "@anticapture/client";

import { getActiveActivityFeedFiltersCount } from "@/features/feed/hooks/activityFeedFilters";

export function useActivityFeedParams() {
  const [orderDirection, setOrderDirection] = useQueryState(
    "sort",
    parseAsStringEnum<OrderDirection>(
      Object.values(orderDirectionEnum),
    ).withDefault("desc"),
  );
  const [relevance, setRelevance] = useQueryState(
    "relevance",
    parseAsStringEnum<FeedRelevance>(
      Object.values(feedRelevanceEnum),
    ).withDefault("MEDIUM"),
  );
  const [fromDate, setFromDate] = useQueryState("from", parseAsInteger);
  const [toDate, setToDate] = useQueryState("to", parseAsInteger);
  const [eventTypes, setEventTypes] = useQueryState(
    "type",
    parseAsArrayOf(
      parseAsStringEnum<FeedEventType>(Object.values(feedEventTypeEnum)),
    ),
  );

  const filters: FeedEventsQueryParams = {
    orderDirection,
    relevance,
    fromDate: fromDate ?? undefined,
    toDate: toDate ?? undefined,
    type: eventTypes ?? undefined,
  };

  const setFilters = useCallback(
    (newFilters: FeedEventsQueryParams) => {
      setOrderDirection(newFilters.orderDirection ?? "desc");
      setRelevance(newFilters.relevance ?? null);
      setFromDate(newFilters.fromDate || null);
      setToDate(newFilters.toDate || null);
      setEventTypes(
        newFilters.type && newFilters.type.length > 0 ? newFilters.type : null,
      );
    },
    [setOrderDirection, setRelevance, setFromDate, setToDate, setEventTypes],
  );

  const clearFilters = useCallback(() => {
    setOrderDirection(null);
    setRelevance(null);
    setFromDate(null);
    setToDate(null);
    setEventTypes(null);
  }, [setOrderDirection, setRelevance, setFromDate, setToDate, setEventTypes]);

  const activeFiltersCount = getActiveActivityFeedFiltersCount(filters);

  return { filters, setFilters, clearFilters, activeFiltersCount };
}
