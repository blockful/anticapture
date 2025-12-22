/**
 * Forward-fill interpolation utility for time-series data.
 *
 * Forward-fill means: use the last known value for any missing data points.
 * This is commonly used in financial data where values persist until they change.
 *
 */

import { truncateTimestampTimeMs } from "@/eventHandlers/shared";
import { ONE_DAY_MS } from "@/lib/enums";

/**
 * Forward-fill sparse data across a master timeline.
 *
 * @param timeline - Sorted array of timestamps
 * @param sparseData - Map of timestamp to value (may have gaps)
 * @param initialValue - Optional initial value to use when no data exists before the first timeline entry
 * @returns Map with values filled for all timeline timestamps
 */
export function forwardFill<T>(
  timeline: number[],
  sparseData: Map<number, T>,
  initialValue?: T,
): Map<number, T> {
  const result = new Map<number, T>();
  let lastKnownValue: T | undefined = initialValue;

  for (const timestamp of timeline) {
    // Update last known value if we have data at this timestamp
    if (sparseData.has(timestamp)) {
      lastKnownValue = sparseData.get(timestamp);
    }

    // Use last known value (or undefined if no data yet)
    if (lastKnownValue !== undefined) {
      result.set(timestamp, lastKnownValue);
    }
  }

  return result;
}

/**
 * Create daily timeline from first data point to today (midnight UTC)
 * Accepts multiple maps and finds the earliest timestamp across all
 */
export function createDailyTimelineFromData(
  ...dataMaps: Map<number, unknown>[]
): number[] {
  const allTimestamps = dataMaps.flatMap((map) => [...map.keys()]);

  if (allTimestamps.length === 0) return [];

  const firstTimestamp = Math.min(...allTimestamps);
  const todayMidnight = truncateTimestampTimeMs(Date.now());
  const totalDays =
    Math.floor((todayMidnight - firstTimestamp) / ONE_DAY_MS) + 1;

  return Array.from(
    { length: totalDays },
    (_, i) => firstTimestamp + i * ONE_DAY_MS,
  );
}
