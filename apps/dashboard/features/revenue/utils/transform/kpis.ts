import type {
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
  pctDelta,
  presentDelta,
  splitIntoWindows,
  sumBy,
} from "@/features/revenue/utils/window";

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
      ? presentDelta(rawDelta)
      : null;

  const unit = args.deltaKind === "pct" ? "%" : "pp";

  return {
    title: args.title,
    value: current.length > 0 ? args.formatValue(currentValue) : "—",
    subtext: sinceLabel,
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

export function computeKpis(
  newWallets: RevenueNewWalletsItem[],
  funnel: RevenueRenewalFunnelItem[],
  totals: RevenueTotalsItem[],
  window: KpiWindow,
): KpiCard[] {
  return [
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
