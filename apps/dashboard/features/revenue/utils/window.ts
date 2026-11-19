/**
 * The time window a KPI card aggregates over. `months: null` means "MAX" —
 * no slicing, and no previous-period comparison can be drawn.
 */
export type KpiWindow = {
  months: number | null;
  label: string;
};

// --- Calendar windows ------------------------------------------------------

const SECONDS_PER_DAY = 86_400;

/** Month index counted from year 0, so consecutive months differ by 1. */
const toMonthIndex = (unixSeconds: number): number => {
  const d = new Date(unixSeconds * 1000);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
};

const monthIndexToStart = (monthIndex: number): number =>
  Date.UTC(Math.floor(monthIndex / 12), monthIndex % 12, 1) / 1000;

/**
 * A run of whole calendar months. `start` is the first month's start and
 * `end` the exclusive end (start of the month after the last one), both in
 * Unix seconds UTC.
 */
export type CalendarWindow = {
  start: number;
  end: number;
  /** Start of the last month in the window, for labels. */
  lastMonthStart: number;
  months: number;
  days: number;
};

const buildCalendarWindow = (
  firstMonthIndex: number,
  months: number,
): CalendarWindow => {
  const start = monthIndexToStart(firstMonthIndex);
  const end = monthIndexToStart(firstMonthIndex + months);
  return {
    start,
    end,
    lastMonthStart: monthIndexToStart(firstMonthIndex + months - 1),
    months,
    days: (end - start) / SECONDS_PER_DAY,
  };
};

/**
 * The `months` calendar months fully covered by data that ends at `cutoff`
 * (month end <= cutoff), plus the same number of months right before them.
 * The month holding the cutoff is never included: it is only partly covered.
 */
export function fullMonthWindows(
  cutoff: Date,
  months: number,
): { current: CalendarWindow; previous: CalendarWindow } {
  const cutoffMonthIndex = cutoff.getUTCFullYear() * 12 + cutoff.getUTCMonth();
  return {
    current: buildCalendarWindow(cutoffMonthIndex - months, months),
    previous: buildCalendarWindow(cutoffMonthIndex - 2 * months, months),
  };
}

/** Rows whose month starts inside `[start, end)`. */
export function itemsWithin<T extends { date: number }>(
  items: T[],
  start: number,
  end: number,
): T[] {
  return items.filter((item) => item.date >= start && item.date < end);
}

/**
 * True when the series has rows from `window.start` onwards, i.e. the window
 * is inside the data history. Months missing inside the history count as
 * zero; a window that starts before the first row is not comparable.
 */
export function isWindowCovered<T extends { date: number }>(
  items: T[],
  window: CalendarWindow,
): boolean {
  if (items.length === 0) return false;
  const firstMonth = Math.min(...items.map((item) => toMonthIndex(item.date)));
  return toMonthIndex(window.start) >= firstMonth;
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
