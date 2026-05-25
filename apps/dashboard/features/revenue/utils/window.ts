import { formatCompact } from "@/features/revenue/utils/format";

/**
 * The time window a KPI card aggregates over. `months: null` means "MAX" —
 * no slicing, and no previous-period comparison can be drawn.
 */
export type KpiWindow = {
  months: number | null;
  label: string;
};

export type WindowSlice<T> = {
  current: T[];
  /**
   * The window immediately before `current`. Null when MAX is selected or when
   * the dataset is too short to produce a full previous window — in both cases
   * the caller should degrade and skip the delta.
   */
  previous: T[] | null;
};

/**
 * Splits a chronologically-sorted series into the latest window and the one
 * immediately before it. Used to compute "current vs previous period" deltas.
 */
export function splitIntoWindows<T>(
  items: T[],
  months: number | null,
): WindowSlice<T> {
  if (months === null) return { current: items, previous: null };
  const current = items.slice(-months);
  if (items.length < 2 * months) return { current, previous: null };
  return { current, previous: items.slice(-2 * months, -months) };
}

export function sumBy<T>(items: T[], extract: (i: T) => number): number {
  return items.reduce((s, i) => s + extract(i), 0);
}

export function avgBy<T>(items: T[], extract: (i: T) => number): number {
  if (items.length === 0) return 0;
  return sumBy(items, extract) / items.length;
}

/** Percent change from `prev` to `curr`. Returns null when prev is 0. */
export function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export function formatCountDelta(n: number): string {
  return `${n >= 0 ? "+" : ""}${formatCompact(n)}`;
}

export type DeltaPresentation = {
  text: string;
  trend: "up" | "down" | undefined;
};

/**
 * Formats a percentage-ish delta with adaptive precision: up to 2 decimals
 * for small magnitudes (<0.1), 1 decimal for [0.1, 1), 0 decimals otherwise.
 * Returns the trend in lockstep with the rendered value — when the value
 * rounds to 0 at the chosen precision, the trend is `undefined` (neutral).
 *
 * The point: a real +0.4% change should display as "+0.4%" with an up arrow,
 * not "+0%" (which would erase the signal) and not "+0%" with an arrow
 * (which would conflict with the rendered value).
 */
export function presentDelta(value: number, suffix: string): DeltaPresentation {
  const abs = Math.abs(value);
  const precision = abs >= 1 ? 0 : abs >= 0.1 ? 1 : 2;
  // Snap to display precision so text and trend can never disagree.
  const snapped = Number(value.toFixed(precision));
  if (snapped === 0) return { text: `0${suffix}`, trend: undefined };
  const prefix = snapped > 0 ? "+" : "";
  return {
    text: `${prefix}${snapped.toFixed(precision)}${suffix}`,
    trend: snapped > 0 ? "up" : "down",
  };
}
