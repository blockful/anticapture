/**
 * Core time-series utilities for forward-fill and timeline generation.
 *
 * Forward-fill: Use the last known value for any missing data points.
 */

import { truncateTimestampToMidnight } from "./date-helpers";
import { SECONDS_IN_DAY } from "./enums";

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
 * Generate ordered daily timeline from dates array.
 *
 * Creates a complete daily timeline from startDate (or first date in array)
 * to endDate (or today), optionally reversed for descending order.
 *
 * @param params.datesFromDb - Array of timestamps from database (will be sorted)
 * @param params.startDate - Optional start date override
 * @param params.endDate - Optional end date (defaults to today)
 * @param params.orderDirection - "asc" or "desc" ordering
 * @returns Array of daily timestamps
 */
export function generateOrderedTimeline(params: {
  datesFromDb: number[];
  startDate?: number;
  endDate?: number;
  orderDirection?: "asc" | "desc";
}): number[] {
  const { datesFromDb, startDate, endDate, orderDirection } = params;

  if (datesFromDb.length === 0 && !startDate) return [];

  const sortedDates = [...datesFromDb].sort((a, b) => a - b);
  const firstDate = startDate ?? sortedDates[0];
  const lastDate =
    endDate ?? truncateTimestampToMidnight(Math.floor(Date.now() / 1000));

  if (!firstDate || !lastDate) return [];

  const timeline = createDailyTimeline(firstDate, lastDate);
  if (orderDirection === "desc") timeline.reverse();
  return timeline;
}
