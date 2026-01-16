/**
 * Date and timestamp utilities for time-series data processing.
 */

import { SECONDS_IN_DAY } from "./enums";

/**
 * Truncate timestamp (seconds) to midnight UTC
 */
export const truncateTimestampToMidnight = (timestampSec: number): number => {
  return Math.floor(timestampSec / SECONDS_IN_DAY) * SECONDS_IN_DAY;
};

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

/**
 * Get effective start date, adjusting if no initial value exists.
 *
 * When querying time-series data with forward-fill, if there's no initial value
 * before the requested start date, we should start from the first real data point
 * to avoid returning zeros/nulls.
 *
 * @param params.referenceDate - Requested start date (after ?? startDate)
 * @param params.datesFromDb - Array of timestamps from database
 * @param params.hasInitialValue - Whether an initial value exists before referenceDate
 * @returns Effective start date to use
 */
export function getEffectiveStartDate(params: {
  referenceDate?: number;
  datesFromDb: number[];
  hasInitialValue: boolean;
}): number | undefined {
  const { referenceDate, datesFromDb, hasInitialValue } = params;

  if (!referenceDate) return undefined;
  if (hasInitialValue || datesFromDb.length === 0) return referenceDate;

  const sortedDates = [...datesFromDb].sort((a, b) => a - b);
  const firstRealDate = sortedDates[0];

  return firstRealDate && referenceDate < firstRealDate
    ? firstRealDate
    : referenceDate;
}
