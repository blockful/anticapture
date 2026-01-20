/**
 * Time-series utilities for forward-fill, timeline creation, and data filtering.
 *
 * Forward-fill: Use the last known value for any missing data points.
 */

import { SECONDS_IN_DAY } from "./enums";

/**
 * Truncate timestamp (seconds) to midnight UTC
 */
export const truncateTimestampToMidnight = (timestampSec: number): number => {
  return Math.floor(timestampSec / SECONDS_IN_DAY) * SECONDS_IN_DAY;
};

/**
 * Forward-fill sparse data across a master timeline.
 *
 * Works with any key type (number, bigint, string) and any value type.
 *
 * @param timeline - Sorted array of timestamps/keys
 * @param sparseData - Map of key to value (may have gaps)
 * @param initialValue - Optional initial value when no data exists before first entry
 * @returns Map with values filled for all timeline keys
 *
 * @example
 * // With numbers
 * const filled = forwardFill([1000, 2000, 3000], new Map([[1000, 10]]), 0);
 * // Result: Map { 1000 => 10, 2000 => 10, 3000 => 10 }
 *
 */
export function forwardFill<K, V>(
  timeline: K[],
  sparseData: Map<K, V>,
  initialValue?: V,
): Map<K, V> {
  const result = new Map<K, V>();
  let lastKnownValue: V | undefined = initialValue;

  for (const key of timeline) {
    if (sparseData.has(key)) {
      lastKnownValue = sparseData.get(key);
    }

    if (lastKnownValue !== undefined) {
      result.set(key, lastKnownValue);
    }
  }

  return result;
}

/**
 * Create daily timeline from first timestamp to last timestamp (seconds).
 *
 * @param firstTimestamp - Start timestamp in seconds (will be truncated to midnight)
 * @param lastTimestamp - End timestamp in seconds (will be truncated to midnight)
 * @returns Array of daily timestamps (midnight UTC) in seconds
 */
export function createDailyTimeline(
  firstTimestamp: number,
  lastTimestamp?: number,
): number[] {
  if (!lastTimestamp) {
    lastTimestamp = truncateTimestampToMidnight(Math.floor(Date.now() / 1000));
  }
  if (firstTimestamp > lastTimestamp) return [];
  const startMidnight = truncateTimestampToMidnight(firstTimestamp);
  const endMidnight = truncateTimestampToMidnight(lastTimestamp);
  const totalDays =
    Math.floor((endMidnight - startMidnight) / SECONDS_IN_DAY) + 1;

  return Array.from(
    { length: totalDays },
    (_, i) => startMidnight + i * SECONDS_IN_DAY,
  );
}

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
 * Calculate cutoff timestamp for filtering data by days
 */
export const calculateCutoffTimestamp = (days: number): number => {
  return Math.floor(Date.now() / 1000) - days * SECONDS_IN_DAY;
};

/**
 * Normalize all timestamps in a Map to midnight UTC (seconds)
 */
export const normalizeMapTimestamps = <T>(
  map: Map<number, T>,
): Map<number, T> => {
  const normalized = new Map<number, T>();
  map.forEach((value, ts) => {
    normalized.set(truncateTimestampToMidnight(ts), value);
  });
  return normalized;
};
