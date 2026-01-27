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
