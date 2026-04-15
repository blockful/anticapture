import type { FeedEventsQueryParams } from "@anticapture/client";
import { feedEventTypeEnum, feedRelevanceEnum } from "@anticapture/client";

import { getActiveActivityFeedFiltersCount } from "@/features/feed/utils/activityFeedFilters";

describe("getActiveActivityFeedFiltersCount", () => {
  test("returns zero for the default filters", () => {
    const filters: FeedEventsQueryParams = {
      orderDirection: "desc",
      relevance: feedRelevanceEnum.MEDIUM,
    };

    const result = getActiveActivityFeedFiltersCount(filters);

    expect(result).toBe(0);
  });

  test("counts each non-default filter", () => {
    const filters: FeedEventsQueryParams = {
      fromDate: 1_705_363_200,
      toDate: 1_705_449_599,
      orderDirection: "asc",
      relevance: feedRelevanceEnum.HIGH,
      type: feedEventTypeEnum.VOTE,
    };

    const result = getActiveActivityFeedFiltersCount(filters);

    expect(result).toBe(5);
  });
});
