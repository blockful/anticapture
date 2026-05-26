import {
  type FeedEventsQueryParams,
  feedRelevanceEnum,
} from "@anticapture/client";

export const getActiveActivityFeedFiltersCount = (
  filters: FeedEventsQueryParams,
) =>
  [
    filters.fromDate,
    filters.toDate,
    filters.orderDirection !== "desc",
    filters.relevance !== feedRelevanceEnum.MEDIUM,
    filters.type && filters.type.length > 0,
  ].filter(Boolean).length;
