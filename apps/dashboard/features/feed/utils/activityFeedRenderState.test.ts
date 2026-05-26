import { getActivityFeedRenderState } from "@/features/feed/utils/activityFeedRenderState";

describe("getActivityFeedRenderState", () => {
  test("renders full-page skeletons only while the initial feed is loading", () => {
    const result = getActivityFeedRenderState({
      groupCount: 0,
      loading: true,
    });

    expect(result).toEqual({
      showInitialSkeleton: true,
      showIncrementalSpinner: false,
    });
  });

  test("keeps existing feed content visible during incremental loading", () => {
    const result = getActivityFeedRenderState({
      groupCount: 1,
      loading: true,
    });

    expect(result).toEqual({
      showInitialSkeleton: false,
      showIncrementalSpinner: true,
    });
  });

  test("hides loading affordances when the feed is idle", () => {
    const result = getActivityFeedRenderState({
      groupCount: 1,
      loading: false,
    });

    expect(result).toEqual({
      showInitialSkeleton: false,
      showIncrementalSpinner: false,
    });
  });
});
