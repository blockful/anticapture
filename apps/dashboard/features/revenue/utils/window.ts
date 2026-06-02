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

export type DeltaPresentation = {
  text: string;
  trend: "up" | "down" | undefined;
};

export function presentDelta(value: number): DeltaPresentation {
  const abs = Math.abs(value);
  const precision = abs >= 1 ? 0 : abs >= 0.1 ? 1 : 2;
  // Snap to display precision so text and trend can never disagree.
  const snapped = Number(value.toFixed(precision));
  if (snapped === 0) return { text: "0", trend: undefined };
  const prefix = snapped > 0 ? "+" : "";
  return {
    text: `${prefix}${snapped.toFixed(precision)}`,
    trend: snapped > 0 ? "up" : "down",
  };
}
