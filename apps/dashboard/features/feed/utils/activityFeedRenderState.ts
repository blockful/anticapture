export const getActivityFeedRenderState = ({
  groupCount,
  loading,
}: {
  groupCount: number;
  loading: boolean;
}) => {
  const hasRenderedGroups = groupCount > 0;

  return {
    showInitialSkeleton: loading && !hasRenderedGroups,
    showIncrementalSpinner: loading && hasRenderedGroups,
  };
};
