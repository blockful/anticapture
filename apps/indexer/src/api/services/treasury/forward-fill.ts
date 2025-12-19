/**
 * Forward-fill interpolation utility for time-series data.
 *
 * Forward-fill means: use the last known value for any missing data points.
 * This is commonly used in financial data where values persist until they change.
 *
 */

/**
 * Forward-fill sparse data across a master timeline.
 *
 * @param timeline - Sorted array of timestamps
 * @param sparseData - Map of timestamp to value (may have gaps)
 * @returns Map with values filled for all timeline timestamps
 */
export function forwardFill<T>(
  timeline: number[],
  sparseData: Map<number, T>,
): Map<number, T> {
  const result = new Map<number, T>();
  let lastKnownValue: T | undefined;

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
 * Create a sorted timeline from multiple data sources.
 * Useful when you need a master timeline from different datasets.
 *
 * @param dataSources - Array of Maps with timestamp keys
 * @returns Sorted unique timestamps
 */
export function createTimeline(
  ...dataSources: Array<Map<number, unknown>>
): number[] {
  const uniqueTimestamps = new Set<number>();

  for (const source of dataSources) {
    source.forEach((_, timestamp) => uniqueTimestamps.add(timestamp));
  }

  return Array.from(uniqueTimestamps).sort((a, b) => a - b);
}
