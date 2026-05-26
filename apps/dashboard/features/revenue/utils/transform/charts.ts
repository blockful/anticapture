import type {
  RevenueActionsItem,
  RevenueActiveNamesItem,
  RevenueNewWalletsItem,
  RevenueRenewalFunnelItem,
  RevenueRenewalTenureBucket,
  RevenueRenewalTenureItem,
  RevenueTotalsItem,
} from "@anticapture/client";

import type { RevenueOverview, RevenueStream } from "@/features/revenue/types";
import {
  formatCompact,
  formatMonthLabel,
  formatUsd,
} from "@/features/revenue/utils/format";

// --- Revenue Overview card -------------------------------------------------

type StreamSpec = {
  name: string;
  color: string;
  amountUsd: number;
  totalUsd: number;
  actionCount: number;
  actionLabel: string;
};

function buildStream({
  name,
  color,
  amountUsd,
  totalUsd,
  actionCount,
  actionLabel,
}: StreamSpec): RevenueStream {
  const sharePercent = totalUsd > 0 ? (amountUsd / totalUsd) * 100 : 0;
  const avgPerAction =
    actionCount > 0 ? formatUsd(amountUsd / actionCount) : "—";
  return {
    name,
    color,
    amount: formatUsd(amountUsd),
    share: `${sharePercent.toFixed(1)}%`,
    sharePercent,
    volume: `${formatCompact(actionCount)} ${actionLabel}`,
    avgRevenue: `${avgPerAction} avg`,
  };
}

function computeYtdDelta(
  totalsItems: RevenueTotalsItem[],
): RevenueOverview["ytdDelta"] {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const prevYear = currentYear - 1;

  const currentMonths = new Set<number>();
  const prevMonths = new Set<number>();
  for (const item of totalsItems) {
    const d = new Date(item.date * 1000);
    const m = d.getUTCMonth();
    if (m >= currentMonth) continue;
    if (d.getUTCFullYear() === currentYear) currentMonths.add(m);
    else if (d.getUTCFullYear() === prevYear) prevMonths.add(m);
  }
  const comparableMonths = new Set(
    [...currentMonths].filter((m) => prevMonths.has(m)),
  );

  if (comparableMonths.size === 0) return undefined;

  const sumForYear = (target: number) =>
    totalsItems
      .filter((i) => {
        const d = new Date(i.date * 1000);
        return (
          d.getUTCFullYear() === target && comparableMonths.has(d.getUTCMonth())
        );
      })
      .reduce((s, i) => s + i.totalUsd, 0);

  const ytd = sumForYear(currentYear);
  const prevYearYtd = sumForYear(prevYear);

  if (prevYearYtd <= 0 || ytd === 0) return undefined;

  const pct = ((ytd - prevYearYtd) / prevYearYtd) * 100;
  return {
    text: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs same period ${prevYear}`,
    trend: pct >= 0 ? "up" : "down",
  };
}

export function transformToOverview(
  totalsItems: RevenueTotalsItem[],
  actionsItems: RevenueActionsItem[],
): RevenueOverview {
  if (totalsItems.length === 0) {
    return { totalAmount: "—", totalContext: "", streams: [] };
  }

  const totalReg = totalsItems.reduce((s, i) => s + i.registrationUsd, 0);
  const totalRenewal = totalsItems.reduce((s, i) => s + i.renewalUsd, 0);
  const totalPremium = totalsItems.reduce((s, i) => s + i.premiumUsd, 0);
  const total = totalReg + totalRenewal + totalPremium;

  const ytd = totalsItems
    .filter(
      (i) =>
        new Date(i.date * 1000).getUTCFullYear() ===
        new Date().getUTCFullYear(),
    )
    .reduce((s, i) => s + i.totalUsd, 0);
  const firstDate = formatMonthLabel(totalsItems[0].date);

  const actionCounts = { Registration: 0, Renewal: 0, Premium: 0 };
  for (const item of actionsItems) {
    actionCounts[item.category] += item.actions;
  }

  return {
    totalAmount: formatUsd(total),
    totalContext: `since ${firstDate} · ${formatUsd(ytd)} YTD`,
    ytdDelta: computeYtdDelta(totalsItems),
    streams: [
      buildStream({
        name: "Registration",
        color: "#0080bc",
        amountUsd: totalReg,
        totalUsd: total,
        actionCount: actionCounts.Registration,
        actionLabel: "registrations",
      }),
      buildStream({
        name: "Renewals",
        color: "#15803d",
        amountUsd: totalRenewal,
        totalUsd: total,
        actionCount: actionCounts.Renewal,
        actionLabel: "renewals",
      }),
      buildStream({
        name: "Premium",
        color: "#f472b6",
        amountUsd: totalPremium,
        totalUsd: total,
        actionCount: actionCounts.Premium,
        actionLabel: "premium sales",
      }),
    ],
  };
}

// --- Monthly revenue chart -------------------------------------------------

export function transformToMonthlySeries(items: RevenueTotalsItem[]) {
  return {
    xAxisLabels: items.map((i) => formatMonthLabel(i.date)),
    series: [
      {
        name: "Registration",
        data: items.map((i) => i.registrationUsd),
        color: "#0080bc",
      },
      {
        name: "Renewals",
        data: items.map((i) => i.renewalUsd),
        color: "#15803d",
      },
      {
        name: "Premium",
        data: items.map((i) => i.premiumUsd),
        color: "#f472b6",
      },
    ],
  };
}

// --- Name growth chart -----------------------------------------------------

// Two stacked series (gain + loss) coexist so the legend keeps separate
// green/red swatches. Only one is non-zero at any given month, so stacking
// preserves a single full-width bar per point.
export function transformToNameGrowth(items: RevenueActiveNamesItem[]) {
  return {
    xAxisLabels: items.map((i) => formatMonthLabel(i.date)),
    barSeries: [
      {
        name: "Net gain (month)",
        data: items.map((i) => Math.max(0, i.netChange)),
        color: "#15803d",
        stack: "netChange",
      },
      {
        name: "Net loss (month)",
        data: items.map((i) => Math.min(0, i.netChange)),
        color: "#f87171",
        stack: "netChange",
      },
    ],
    lineSeries: [
      {
        name: "Cumulative active names",
        data: items.map((i) => i.cumulativeActive),
        color: "#0080bc",
      },
    ],
  };
}

// --- New wallets chart -----------------------------------------------------

export function transformToNewWallets(items: RevenueNewWalletsItem[]) {
  return {
    xAxisLabels: items.map((i) => formatMonthLabel(i.date)),
    barSeries: [
      {
        name: "New wallets (month)",
        data: items.map((i) => i.newWallets),
        color: "#15803d",
      },
    ],
    lineSeries: [
      {
        name: "Cumulative unique wallets",
        data: items.map((i) => i.cumulativeWallets),
        color: "#0080bc",
      },
    ],
  };
}

// --- Renewal tenure chart --------------------------------------------------

const TENURE_LABELS: Record<RevenueRenewalTenureBucket, string> = {
  "0 renewals (one-shot)": "Never renewed",
  "1 renewal": "Renewed once",
  "2 renewals": "Renewed twice",
  "3+ renewals": "Renewed 3+ times",
};

const TENURE_COLORS: Record<RevenueRenewalTenureBucket, string> = {
  "0 renewals (one-shot)": "#f87171",
  "1 renewal": "#ca8a04",
  "2 renewals": "#15803d",
  "3+ renewals": "#0080bc",
};

const TENURE_ORDER: RevenueRenewalTenureBucket[] = [
  "0 renewals (one-shot)",
  "1 renewal",
  "2 renewals",
  "3+ renewals",
];

const EXPIRATION_HORIZON_YEARS = 7;

export function transformToRenewalTenure(items: RevenueRenewalTenureItem[]) {
  const maxYear = new Date().getUTCFullYear() + EXPIRATION_HORIZON_YEARS;
  const namesByDate = new Map<
    number,
    Map<RevenueRenewalTenureBucket, number>
  >();
  for (const item of items) {
    if (new Date(item.date * 1000).getUTCFullYear() > maxYear) continue;
    if (!namesByDate.has(item.date)) namesByDate.set(item.date, new Map());
    namesByDate.get(item.date)!.set(item.tenureBucket, item.names);
  }
  const dates = Array.from(namesByDate.keys()).sort((a, b) => a - b);

  // Bucket dates are start-of-month UTC timestamps. Use start-of-current-month
  // as the lower bound so the current month is included, and start of the
  // same month next year as the exclusive upper bound — exactly 12 buckets.
  const now = new Date();
  const startOfCurrentMonth =
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000;
  const startOfPlus12 =
    Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), 1) / 1000;
  const neverRenewedNext12mo = dates
    .filter((d) => d >= startOfCurrentMonth && d < startOfPlus12)
    .reduce(
      (sum, d) => sum + (namesByDate.get(d)?.get("0 renewals (one-shot)") ?? 0),
      0,
    );

  return {
    xAxisLabels: dates.map((d) => formatMonthLabel(d)),
    series: TENURE_ORDER.map((bucket) => ({
      name: TENURE_LABELS[bucket],
      data: dates.map((d) => namesByDate.get(d)?.get(bucket) ?? 0),
      color: TENURE_COLORS[bucket],
    })),
    neverRenewedNext12mo,
  };
}

// --- Renewal rate by expiry-year cohort ------------------------------------

export function transformToRenewalCohorts(
  items: RevenueRenewalFunnelItem[],
): Array<{ year: string; rate: number }> {
  const totalsByYear = new Map<number, { renewed: number; expiring: number }>();
  for (const item of items) {
    const year = new Date(item.date * 1000).getUTCFullYear();
    const prev = totalsByYear.get(year) ?? { renewed: 0, expiring: 0 };
    totalsByYear.set(year, {
      renewed: prev.renewed + item.renewedCount,
      expiring: prev.expiring + item.termsExpiring,
    });
  }
  return Array.from(totalsByYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { renewed, expiring }]) => ({
      year: String(year),
      rate: expiring > 0 ? Math.round((renewed / expiring) * 100) : 0,
    }));
}
