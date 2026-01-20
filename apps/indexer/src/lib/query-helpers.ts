/**
 * Query helpers for pagination and data filtering in time-series APIs.
 */

import { truncateTimestampToMidnight } from "./date-helpers";

/**
 * Filter data by cutoff date with fallback to last value before cutoff.
 *
 * Returns items with date >= cutoffDate. If no items match, returns the last
 * item before the cutoff as fallback (using getLastValueBefore).
 *
 * @param sortedData - Array sorted by date ascending, items must have `date` property
 * @param cutoffDate - Minimum date (inclusive)
 * @returns Filtered data, or last value before cutoff if filter returns empty
 *
 * @example
 * const data = [{ date: 1, value: 10 }, { date: 5, value: 20 }];
 * const result = filterWithFallback(data, 3);
 * // Result: [{ date: 5, value: 20 }]
 *
 * const result2 = filterWithFallback(data, 100);
 * // Result: [{ date: 5, value: 20 }] (fallback to last before cutoff)
 */
export function filterWithFallback<T extends { date: number }>(
  sortedData: T[],
  cutoffDate: number,
): T[] {
  const filtered = sortedData.filter((item) => item.date >= cutoffDate);

  if (filtered.length === 0 && sortedData.length > 0) {
    const lastBefore = getLastValueBefore(sortedData, cutoffDate);
    return lastBefore ? [lastBefore] : [];
  }

  return filtered;
}

/**
 * Get the last value before a given date from sorted data.
 *
 * Useful for finding the initial value for forward-fill when the requested
 * time range starts after the first available data point.
 *
 * @param sortedData - Array sorted by date ascending, items must have `date` property
 * @param beforeDate - The cutoff date (exclusive)
 * @returns The last item before the date, or undefined if none exists
 *
 * @example
 * const data = [{ date: 1, value: 10 }, { date: 5, value: 20 }];
 * const result = getLastValueBefore(data, 3);
 * // Result: { date: 1, value: 10 }
 */
export function getLastValueBefore<T extends { date: number }>(
  sortedData: T[],
  beforeDate: number,
): T | undefined {
  for (let i = sortedData.length - 1; i >= 0; i--) {
    const item = sortedData[i];
    if (item !== undefined && item.date < beforeDate) {
      return item;
    }
  }
  return undefined;
}

/**
 * Apply cursor-based pagination to time-series items.
 *
 * Filters items by after/before cursors and applies limit.
 * Calculates hasNextPage based on whether more data exists.
 *
 * @param params.items - Array of items with date property
 * @param params.after - Return items after this timestamp (exclusive)
 * @param params.before - Return items before this timestamp (exclusive)
 * @param params.limit - Maximum items to return
 * @param params.endDate - If provided, hasNextPage uses simple length check;
 *                         otherwise checks if last item reached today
 * @returns Paginated items and hasNextPage flag
 */
export function applyCursorPagination<T extends { date: string }>(params: {
  items: T[];
  after?: number;
  before?: number;
  skip?: number;
  limit: number;
  endDate?: number;
}): { items: T[]; hasNextPage: boolean } {
  const { items: allItems, after, before, skip, limit, endDate } = params;

  if (skip !== undefined && skip > 0) {
    const items = allItems.slice(skip, skip + limit);
    const hasNextPage = allItems.length > skip + limit;
    return { items, hasNextPage };
  }

  const filteredItems = allItems
    .filter((item) => !after || Number(item.date) > after)
    .filter((item) => !before || Number(item.date) < before);

  const items = filteredItems.slice(0, limit);

  const today = truncateTimestampToMidnight(Math.floor(Date.now() / 1000));
  const lastItemDate = Number(items[items.length - 1]?.date ?? 0);

  const hasNextPage = endDate
    ? filteredItems.length > limit
    : filteredItems.length > limit && lastItemDate < today;

  return { items, hasNextPage };
}
