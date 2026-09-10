import type { Humanized } from "@/shared/services/decoder/types";

/** Names that mark a uint as a point in time rather than an amount. */
export const TIMESTAMP_NAME_HINT =
  /timestamp|deadline|eta|expiry|expires|until|startTime|endTime/i;

const EPOCH_2000 = 946_684_800n; // 2000-01-01T00:00:00Z
const EPOCH_2100 = 4_102_444_800n; // 2100-01-01T00:00:00Z

const FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/**
 * Epoch seconds inside [2000, 2100) render as a UTC date. Anything outside the
 * window is not a timestamp and returns null.
 */
export const humanizeTimestamp = (value: bigint): Humanized | null => {
  if (value < EPOCH_2000 || value >= EPOCH_2100) return null;
  const date = new Date(Number(value) * 1000);
  return {
    kind: "timestamp",
    text: `${FORMATTER.format(date)} UTC`,
    iso: date.toISOString(),
  };
};
