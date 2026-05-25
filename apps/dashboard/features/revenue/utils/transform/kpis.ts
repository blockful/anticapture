import type {
  RevenueActiveNamesItem,
  RevenueNewWalletsItem,
  RevenueRenewalFunnelItem,
  RevenueTotalsItem,
} from "@anticapture/client";

import type { KpiCard } from "@/features/revenue/types";
import {
  formatCompact,
  formatMonthLabel,
  formatUsd,
} from "@/features/revenue/utils/format";
import {
  type KpiWindow,
  formatCountDelta,
  pctDelta,
  presentDelta,
  splitIntoWindows,
  sumBy,
} from "@/features/revenue/utils/window";

/** Maps an integer-count delta to an arrow direction. Zero is neutral. */
function trendFromCount(delta: number): "up" | "down" | undefined {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return undefined;
}

function buildSinceLabel(items: { date: number }[]): string {
  return items[0] ? `since ${formatMonthLabel(items[0].date)}` : "—";
}

/**
 * Flow / rate KPI: aggregates a metric over the current window, then compares
 * to the equivalent previous window. Falls back to a "since X" subtext when
 * we can't draw a previous window (MAX selected, or dataset too short).
 */
function buildFlowKpi<T extends { date: number }>(args: {
  title: string;
  items: T[];
  aggregate: (slice: T[]) => number;
  formatValue: (n: number) => string;
  /** "pct" for sums, "pp" for averages-of-percentages */
  deltaKind: "pct" | "pp";
  window: KpiWindow;
  tooltip?: string;
}): KpiCard {
  const sinceLabel = buildSinceLabel(args.items);
  const { current, previous } = splitIntoWindows(
    args.items,
    args.window.months,
  );

  const currentValue = args.aggregate(current);
  const previousValue = previous ? args.aggregate(previous) : null;

  const rawDelta =
    previousValue !== null
      ? args.deltaKind === "pct"
        ? pctDelta(currentValue, previousValue)
        : currentValue - previousValue
      : null;

  const presentation =
    args.window.months !== null && rawDelta !== null
      ? presentDelta(rawDelta, args.deltaKind === "pct" ? "%" : "pp")
      : null;

  return {
    title: args.title,
    value: current.length > 0 ? args.formatValue(currentValue) : "—",
    subtext: presentation
      ? `${presentation.text} vs prev. ${args.window.label}`
      : sinceLabel,
    trend: presentation?.trend,
    tooltip: args.tooltip,
  };
}

/**
 * Stock KPI ("Active Names"): the value is the cumulative count at the end of
 * the series; the subtext is the net change spanning exactly `window.months`
 * monthly deltas. Requires at least `months + 1` items — otherwise falls back
 * to "since X" to avoid misrepresenting an incomplete window.
 */
function buildStockKpi(args: {
  title: string;
  items: RevenueActiveNamesItem[];
  window: KpiWindow;
  tooltip?: string;
}): KpiCard {
  const sinceLabel = buildSinceLabel(args.items);
  const items = args.items;
  const end = items[items.length - 1];
  const months = args.window.months;

  // Need an anchor `months` boundaries before `end` to measure a full window.
  // 12 monthly items only span 11 monthly deltas, so a "1Y" delta requires 13
  // items (the extra one being the start anchor outside the window).
  const startIndex =
    months !== null && items.length > months ? items.length - 1 - months : null;
  const start = startIndex !== null ? items[startIndex] : null;
  const net =
    end && start ? end.cumulativeActive - start.cumulativeActive : null;

  const canShowDelta = net !== null;

  return {
    title: args.title,
    value: end ? formatCompact(end.cumulativeActive) : "—",
    subtext: canShowDelta
      ? `${formatCountDelta(net)} in ${args.window.label}`
      : sinceLabel,
    trend: canShowDelta ? trendFromCount(net) : undefined,
    tooltip: args.tooltip,
  };
}

export function computeKpis(
  activeNames: RevenueActiveNamesItem[],
  newWallets: RevenueNewWalletsItem[],
  funnel: RevenueRenewalFunnelItem[],
  totals: RevenueTotalsItem[],
  window: KpiWindow,
): KpiCard[] {
  return [
    buildStockKpi({
      title: "Active Names",
      items: activeNames,
      window,
      tooltip:
        "Total .eth names currently registered and not expired. The subtext shows the net change (registrations minus expirations) inside the selected period.",
    }),
    buildFlowKpi({
      title: "New Wallets",
      items: newWallets,
      aggregate: (slice) => sumBy(slice, (i) => i.newWallets),
      formatValue: formatCompact,
      deltaKind: "pct",
      window,
    }),
    buildFlowKpi({
      title: "Renewal Rate",
      items: funnel,
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
      tooltip:
        "Share of expiring names that were renewed. 'pp' (percentage points) is the absolute change between two percentages.",
    }),
    buildFlowKpi({
      title: "Revenue",
      items: totals,
      aggregate: (slice) => sumBy(slice, (i) => i.totalUsd),
      formatValue: formatUsd,
      deltaKind: "pct",
      window,
    }),
  ];
}
