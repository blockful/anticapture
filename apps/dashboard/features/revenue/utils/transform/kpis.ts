import type {
  RevenueNewWalletsItem,
  RevenueRenewalFunnelItem,
  RevenueTotalsItem,
} from "@anticapture/client";

import type { KpiCard } from "@/features/revenue/types";
import {
  formatCompact,
  formatCutoffEnd,
  formatMonthLabel,
  formatMonthRange,
  formatUsd,
  formatUtcDate,
} from "@/features/revenue/utils/format";
import {
  toRenewalCohortCutoff,
  UNAVAILABLE_TEXT,
} from "@/features/revenue/utils/meta";
import {
  type CalendarWindow,
  fullMonthWindows,
  isWindowCovered,
  itemsWithin,
  type KpiWindow,
  pctDelta,
  presentDelta,
  sumBy,
} from "@/features/revenue/utils/window";

/** One API series feeding a KPI, with the instant its data runs up to. */
export type KpiSeries<T> = {
  items: T[];
  cutoff: Date;
  unavailable: boolean;
  /**
   * False when the cutoff was inferred from the rows (no `meta.asOf`); copy
   * then names the latest month of data instead of a date. Defaults to true.
   */
  cutoffKnown?: boolean;
};

export const KPI_DESCRIPTIONS = {
  newWallets:
    "First-time wallets: each wallet is counted once, in the month it first sent a registration or renewal transaction to a .eth registrar controller (May 2019 onward). The wallet is the transaction sender, not necessarily the name owner.",
  renewalRate:
    "Share of .eth registration terms expiring in the window that were renewed before the end of their grace period (expiry + 90 days), weighted by the number of terms. Each registration or renewal is one term, grouped by the month it expires.",
  revenue:
    "Protocol revenue from .eth registrations, renewals and premiums paid to the v1 ETH registrar controllers, counted when paid. ETH is converted to USD at each month's average ETH price. 2023-controller renewals outside Dec 2024 to Sep 2025 are counted at the amount sent, before refunds of overpayment. Payments through ENSv2 (from Oct 27, 2026, in USDC or DAI) are not yet included.",
} as const;

const formatWindow = (window: CalendarWindow): string =>
  formatMonthRange(window.start, window.lastMonthStart);

/**
 * Flow / rate KPI: aggregates a metric over the last N full calendar months
 * before the series cutoff, then compares with the N months before. Falls
 * back to a "since X" subtext when no previous window can be drawn (MAX
 * selected, or the data history is too short).
 */
function buildFlowKpi<T extends { date: number }>(args: {
  title: string;
  description: string;
  /** How the window's end relates to the data, e.g. "before the data cutoff". */
  windowEndNote: string;
  series: KpiSeries<T>;
  aggregate: (slice: T[]) => number;
  formatValue: (n: number) => string;
  /** "pct" for sums, "pp" for averages-of-percentages */
  deltaKind: "pct" | "pp";
  window: KpiWindow;
}): KpiCard {
  const { items, cutoff } = args.series;
  const cutoffKnown = args.series.cutoffKnown ?? true;

  if (args.series.unavailable) {
    return {
      title: args.title,
      value: UNAVAILABLE_TEXT,
      subtext: "Up-to-date data is not available",
      tooltip: args.description,
      unavailable: true,
    };
  }

  const cutoffSeconds = cutoff.getTime() / 1000;
  const sinceLabel = items[0]
    ? `since ${formatMonthLabel(items[0].date)}`
    : "—";

  if (args.window.months === null) {
    const current = itemsWithin(items, -Infinity, cutoffSeconds);
    const period = items[0]
      ? `${formatMonthLabel(items[0].date)} to ${formatCutoffEnd(cutoff, cutoffKnown)}`
      : `up to ${formatCutoffEnd(cutoff, cutoffKnown)}`;
    return {
      title: args.title,
      value:
        current.length > 0 ? args.formatValue(args.aggregate(current)) : "—",
      subtext: sinceLabel,
      tooltip: `${args.description} Window: all data, ${period}.`,
    };
  }

  const windows = fullMonthWindows(cutoff, args.window.months);
  const current = itemsWithin(
    items,
    windows.current.start,
    windows.current.end,
  );
  const currentValue = args.aggregate(current);
  const previousValue = isWindowCovered(items, windows.previous)
    ? args.aggregate(
        itemsWithin(items, windows.previous.start, windows.previous.end),
      )
    : null;

  const rawDelta =
    previousValue !== null
      ? args.deltaKind === "pct"
        ? pctDelta(currentValue, previousValue)
        : currentValue - previousValue
      : null;
  const presentation = rawDelta !== null ? presentDelta(rawDelta) : null;
  const unit = args.deltaKind === "pct" ? "%" : "pp";

  const windowText = `Window: ${formatWindow(windows.current)} (${args.window.months} full months ${args.windowEndNote})`;
  const comparisonText =
    previousValue !== null
      ? `, compared with ${formatWindow(windows.previous)}.`
      : ". The data does not cover an earlier window to compare with.";

  return {
    title: args.title,
    value: current.length > 0 ? args.formatValue(currentValue) : "—",
    subtext: sinceLabel,
    tooltip: `${args.description} ${windowText}${comparisonText}`,
    delta: presentation
      ? {
          value: presentation.text,
          unit,
          comparison: `vs prev. ${args.window.label}`,
        }
      : undefined,
    trend: presentation?.trend,
  };
}

/** Window end for series whose cutoff is the data cutoff. */
const dataCutoffNote = (series: KpiSeries<unknown>): string =>
  (series.cutoffKnown ?? true)
    ? `before the data cutoff, ${formatUtcDate(series.cutoff)}`
    : `before ${formatMonthLabel(series.cutoff.getTime() / 1000)}, the latest month of data, which may be partial`;

export function computeKpis(
  series: {
    newWallets: KpiSeries<RevenueNewWalletsItem>;
    funnel: KpiSeries<RevenueRenewalFunnelItem>;
    totals: KpiSeries<RevenueTotalsItem>;
  },
  window: KpiWindow,
): KpiCard[] {
  // An expiry cohort only resolves once its 90-day grace period is over. The
  // API's funnel holds resolved cohorts only, so a cutoff inferred from its
  // rows (no asOf) is already the cohort cutoff.
  const funnelCutoffKnown = series.funnel.cutoffKnown ?? true;
  const cohortCutoff = funnelCutoffKnown
    ? toRenewalCohortCutoff(series.funnel.cutoff)
    : series.funnel.cutoff;
  return [
    buildFlowKpi({
      title: "New Wallets",
      description: KPI_DESCRIPTIONS.newWallets,
      windowEndNote: dataCutoffNote(series.newWallets),
      series: series.newWallets,
      aggregate: (slice) => sumBy(slice, (i) => i.newWallets),
      formatValue: formatCompact,
      deltaKind: "pct",
      window,
    }),
    buildFlowKpi({
      title: "Renewal Rate",
      description: KPI_DESCRIPTIONS.renewalRate,
      windowEndNote: funnelCutoffKnown
        ? `of expiry dates before ${formatUtcDate(cohortCutoff)}, whose grace period ended by the data cutoff, ${formatUtcDate(series.funnel.cutoff)}`
        : `of expiry dates before ${formatMonthLabel(cohortCutoff.getTime() / 1000)}, the latest expiry month in the data, which may be partial`,
      series: { ...series.funnel, cutoff: cohortCutoff },
      aggregate: (slice) => {
        // Weighted by termsExpiring so months with high volume dominate the
        // period rate — unweighted averaging distorts when months differ in
        // volume (e.g. 50% renewal on 10K terms vs 100% on 100 terms).
        const totalExpiring = sumBy(slice, (i) => i.termsExpiring);
        if (totalExpiring === 0) return 0;
        const totalRenewed = sumBy(slice, (i) => i.renewedCount);
        return (totalRenewed / totalExpiring) * 100;
      },
      formatValue: (n) => `${n.toFixed(0)}%`,
      deltaKind: "pp",
      window,
    }),
    buildFlowKpi({
      title: "Revenue",
      description: KPI_DESCRIPTIONS.revenue,
      windowEndNote: dataCutoffNote(series.totals),
      series: series.totals,
      aggregate: (slice) => sumBy(slice, (i) => i.totalUsd),
      formatValue: formatUsd,
      deltaKind: "pct",
      window,
    }),
  ];
}
