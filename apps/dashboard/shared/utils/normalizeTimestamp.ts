/**
 * Normalizes a timestamp to midnight UTC (00:00:00)
 * Accepts both seconds and milliseconds, returns seconds
 * @param timestamp - Unix timestamp in seconds or milliseconds
 * @returns Normalized timestamp at midnight UTC in seconds
 */
export const normalizeTimestamp = (timestamp: number | string): number => {
  const ts = Number(timestamp);
  const seconds = ts > 1e12 ? Math.floor(ts / 1000) : ts;
  return Math.floor(seconds / 86400) * 86400;
};
