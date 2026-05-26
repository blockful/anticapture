type PaginatedResponse<T> = { items: T[]; totalCount: number };

export const getNextPageParam = <T>(
  lastPage: PaginatedResponse<T>,
  allPages: PaginatedResponse<T>[],
) => {
  const loadedCount = allPages.reduce(
    (sum, page) => sum + page.items.length,
    0,
  );
  return loadedCount >= lastPage.totalCount ? undefined : loadedCount;
};
