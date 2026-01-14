/**
 * Time-series utilities for forward-fill, timeline creation, and data filtering.
 *
 * Forward-fill: Use the last known value for any missing data points.
 * Common in financial/blockchain data where values persist until they change.
 */

import { ONE_DAY_MS, SECONDS_IN_DAY } from "./enums";

/**
 * Truncate timestamp (milliseconds) to midnight UTC
 */
const truncateToMidnightMs = (timestampMs: number): number => {
  return Math.floor(timestampMs / ONE_DAY_MS) * ONE_DAY_MS;
};

/**
 * Truncate timestamp (seconds) to midnight UTC
 */
const truncateToMidnightSeconds = (timestampSec: number): number => {
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
 * // With numbers (milliseconds)
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
  lastTimestamp: number,
): number[] {
  if (firstTimestamp > lastTimestamp) return [];

  const startMidnight = truncateToMidnightSeconds(firstTimestamp);
  const endMidnight = truncateToMidnightSeconds(lastTimestamp);
  const totalDays =
    Math.floor((endMidnight - startMidnight) / SECONDS_IN_DAY) + 1;

  return Array.from(
    { length: totalDays },
    (_, i) => startMidnight + i * SECONDS_IN_DAY,
  );
}

/**
 * Create daily timeline from first timestamp to last timestamp (milliseconds).
 *
 * @param firstTimestamp - Start timestamp in milliseconds (will be truncated to midnight)
 * @param lastTimestamp - End timestamp in milliseconds (will be truncated to midnight)
 * @returns Array of daily timestamps (midnight UTC) in milliseconds
 */
export function createDailyTimelineMs(
  firstTimestamp: number,
  lastTimestamp: number,
): number[] {
  if (firstTimestamp > lastTimestamp) return [];

  const startMidnight = truncateToMidnightMs(firstTimestamp);
  const endMidnight = truncateToMidnightMs(lastTimestamp);
  const totalDays = Math.floor((endMidnight - startMidnight) / ONE_DAY_MS) + 1;

  return Array.from(
    { length: totalDays },
    (_, i) => startMidnight + i * ONE_DAY_MS,
  );
}

/**
 * Create daily timeline from sparse data timestamps to today (milliseconds).
 *
 * @param timestamps - Array of timestamps from sparse data (in milliseconds)
 * @returns Array of daily timestamps from first data point to today (in milliseconds)
 */
export function createDailyTimelineToToday(timestamps: number[]): number[] {
  if (timestamps.length === 0) return [];

  const firstTimestamp = Math.min(...timestamps);
  const todayMidnight = truncateToMidnightMs(Date.now());

  return createDailyTimelineMs(firstTimestamp, todayMidnight);
}

/**
 * Filter data with fallback to last available value.
 *
 * When filter returns empty but data exists, returns the last item as fallback.
 * Useful for time-series data where you want the most recent value even if
 * it's outside the requested range.
 *
 * @param allData - Complete sorted dataset
 * @param filterFn - Predicate to filter data
 * @returns Filtered data, or last available item if filter returns empty
 *
 * @example
 * const data = [{ date: 1, value: 10 }, { date: 2, value: 20 }];
 * const result = filterWithFallback(data, item => item.date >= 100);
 * // Result: [{ date: 2, value: 20 }] (fallback to last)
 */
export function filterWithFallback<T>(
  allData: T[],
  filterFn: (item: T) => boolean,
): T[] {
  const filtered = allData.filter(filterFn);

  if (filtered.length === 0 && allData.length > 0) {
    return [allData.at(-1)!];
  }

  return filtered;
}
