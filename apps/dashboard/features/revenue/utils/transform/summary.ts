import type { RevenueTotalsItem } from "@anticapture/client";

import type {
  RevenueSummary,
  RevenueTimeframe,
} from "@/features/revenue/types";
import {
  formatCutoffEnd,
  formatMonthLabel,
  formatMonthRange,
  formatUsd,
  formatUsdExact,
} from "@/features/revenue/utils/format";
import {
  type CalendarWindow,
  fullMonthWindows,
  isWindowCovered,
  itemsWithin,
  pctDelta,
  presentDelta,
  sumBy,
} from "@/features/revenue/utils/window";

const RUN_RATE_MONTHS = 3;
const DAYS_PER_YEAR = 365;

const sumTotalUsd = (items: RevenueTotalsItem[]): number =>
  sumBy(items, (item) => item.totalUsd);

const cutoffSeconds = (cutoff: Date): number => cutoff.getTime() / 1000;

/** Total over a calendar window; a month with no row counts as $0. */
const windowTotalUsd = (
  items: RevenueTotalsItem[],
  window: CalendarWindow,
): number => sumTotalUsd(itemsWithin(items, window.start, window.end));

const formatWindow = (window: CalendarWindow): string =>
  formatMonthRange(window.start, window.lastMonthStart);

type ActualRevenue = { usd: number; period: string };

/**
 * 1Y: the 12 full calendar months before the cutoff. YTD: Jan 1 of the
 * cutoff's year up to the cutoff. MAX: every row up to the cutoff.
 * `cutoffKnown` is false when the cutoff was inferred (no `meta.asOf`).
 */
export const computeActualRevenue = (
  items: RevenueTotalsItem[],
  timeframe: RevenueTimeframe,
  cutoff: Date,
  cutoffKnown = true,
): ActualRevenue => {
  const end = cutoffSeconds(cutoff);
  const cutoffEnd = formatCutoffEnd(cutoff, cutoffKnown);
  if (timeframe === "1y") {
    const { current } = fullMonthWindows(cutoff, 12);
    return {
      usd: windowTotalUsd(items, current),
      period: formatWindow(current),
    };
  }
  if (timeframe === "ytd") {
    const yearStart = Date.UTC(cutoff.getUTCFullYear(), 0, 1) / 1000;
    return {
      usd: sumTotalUsd(itemsWithin(items, yearStart, end)),
      period: `Jan 1, ${cutoff.getUTCFullYear()} to ${cutoffEnd}`,
    };
  }
  const included = itemsWithin(items, -Infinity, end);
  return {
    usd: sumTotalUsd(included),
    period: included[0]
      ? `${formatMonthLabel(included[0].date)} to ${cutoffEnd}`
      : `up to ${cutoffEnd}`,
  };
};

export type RunRate = {
  annualizedUsd: number;
  averageDailyUsd: number;
  window: CalendarWindow;
  previousWindow: CalendarWindow;
  previousAverageDailyUsd: number | null;
  /** Percent change in average daily revenue; null when not comparable. */
  deltaPct: number | null;
};

/**
 * Average daily revenue over the last 3 calendar months fully covered by the
 * data, times 365. The delta compares average daily revenue with the 3 full
 * months before, so windows of 90 and 92 days compare fairly.
 */
export const computeRunRate = (
  items: RevenueTotalsItem[],
  cutoff: Date,
): RunRate => {
  const { current, previous } = fullMonthWindows(cutoff, RUN_RATE_MONTHS);
  const averageDailyUsd = windowTotalUsd(items, current) / current.days;
  const previousAverageDailyUsd = isWindowCovered(items, previous)
    ? windowTotalUsd(items, previous) / previous.days
    : null;
  return {
    annualizedUsd: averageDailyUsd * DAYS_PER_YEAR,
    averageDailyUsd,
    window: current,
    previousWindow: previous,
    previousAverageDailyUsd,
    deltaPct:
      previousAverageDailyUsd === null
        ? null
        : pctDelta(averageDailyUsd, previousAverageDailyUsd),
  };
};

const presentRunRateDelta = (runRate: RunRate): RevenueSummary["qoqDelta"] => {
  if (runRate.deltaPct === null) return undefined;
  const presented = presentDelta(runRate.deltaPct);
  if (!presented.trend) return undefined;
  return {
    pct: runRate.deltaPct,
    text: `${presented.text}% vs prior 3 months`,
    trend: presented.trend,
    previousPeriod: formatWindow(runRate.previousWindow),
    formula:
      runRate.previousAverageDailyUsd === null
        ? ""
        : `(${formatUsdExact(runRate.averageDailyUsd)} ÷ ${formatUsdExact(runRate.previousAverageDailyUsd)} − 1) × 100`,
  };
};

export const computeRevenueSummary = (
  items: RevenueTotalsItem[],
  timeframe: RevenueTimeframe,
  cutoff: Date,
  cutoffKnown = true,
): RevenueSummary => {
  const actual = computeActualRevenue(items, timeframe, cutoff, cutoffKnown);
  const runRate = computeRunRate(items, cutoff);

  return {
    actualUsd: actual.usd,
    actualAmount: formatUsd(actual.usd),
    actualPeriod: actual.period,
    runRateUsd: runRate.annualizedUsd,
    runRate: formatUsd(runRate.annualizedUsd),
    runRatePeriod: formatWindow(runRate.window),
    runRateFormula: `${formatUsdExact(runRate.averageDailyUsd * runRate.window.days)} ÷ ${runRate.window.days} days × ${DAYS_PER_YEAR} = ${formatUsdExact(runRate.annualizedUsd)}`,
    qoqDelta: presentRunRateDelta(runRate),
  };
};
