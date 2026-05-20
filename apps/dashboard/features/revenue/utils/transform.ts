import type {
  RevenueActionsItem,
  RevenueActiveNamesItem,
  RevenueNewWalletsItem,
  RevenueRenewalFunnelItem,
  RevenueRenewalTenureBucket,
  RevenueRenewalTenureItem,
  RevenueTotalsItem,
} from "@anticapture/client";

import type { KpiCard, RevenueOverview } from "@/features/revenue/types";
import {
  formatCompact,
  formatMonthLabel,
  formatUsd,
} from "@/features/revenue/utils/format";

export function transformToOverview(
  totalsItems: RevenueTotalsItem[],
  actionsItems: RevenueActionsItem[],
): RevenueOverview {
  if (totalsItems.length === 0) {
    return { totalAmount: "—", totalContext: "", streams: [] };
  }

  const totalReg = totalsItems.reduce((s, i) => s + i.registrationUsd, 0);
  const totalPremium = totalsItems.reduce((s, i) => s + i.premiumUsd, 0);
  const totalRenewal = totalsItems.reduce((s, i) => s + i.renewalUsd, 0);
  const total = totalReg + totalPremium + totalRenewal;

  const sharePercent = (part: number) => (total > 0 ? (part / total) * 100 : 0);

  const currentYear = new Date().getUTCFullYear();
  const ytd = totalsItems
    .filter((i) => new Date(i.date * 1000).getUTCFullYear() === currentYear)
    .reduce((s, i) => s + i.totalUsd, 0);

  const firstDate = formatMonthLabel(totalsItems[0].date);

  const actionsMap = { Registration: 0, Renewal: 0, Premium: 0 };
  for (const item of actionsItems) {
    actionsMap[item.category] += item.actions;
  }

  return {
    totalAmount: formatUsd(total),
    totalContext: `since ${firstDate} · ${formatUsd(ytd)} YTD`,
    streams: [
      {
        name: "Registration",
        color: "#0080bc",
        amount: formatUsd(totalReg),
        share: `${sharePercent(totalReg).toFixed(1)}%`,
        sharePercent: sharePercent(totalReg),
        volume: `${formatCompact(actionsMap.Registration)} registrations`,
        avgRevenue: `${actionsMap.Registration > 0 ? formatUsd(totalReg / actionsMap.Registration) : "—"} avg`,
      },
      {
        name: "Renewals",
        color: "#15803d",
        amount: formatUsd(totalRenewal),
        share: `${sharePercent(totalRenewal).toFixed(1)}%`,
        sharePercent: sharePercent(totalRenewal),
        volume: `${formatCompact(actionsMap.Renewal)} renewals`,
        avgRevenue: `${actionsMap.Renewal > 0 ? formatUsd(totalRenewal / actionsMap.Renewal) : "—"} avg`,
      },
      {
        name: "Premium",
        color: "#f472b6",
        amount: formatUsd(totalPremium),
        share: `${sharePercent(totalPremium).toFixed(1)}%`,
        sharePercent: sharePercent(totalPremium),
        volume: `${formatCompact(actionsMap.Premium)} premium sales`,
        avgRevenue: `${actionsMap.Premium > 0 ? formatUsd(totalPremium / actionsMap.Premium) : "—"} avg`,
      },
    ],
  };
}

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

export function transformToNameGrowth(items: RevenueActiveNamesItem[]) {
  return {
    xAxisLabels: items.map((i) => formatMonthLabel(i.date)),
    barSeries: [
      {
        name: "Net gain (month)",
        data: items.map((i) => Math.max(0, i.netChange)),
        color: "#15803d",
      },
      {
        name: "Net loss (month)",
        data: items.map((i) => Math.min(0, i.netChange)),
        color: "#f87171",
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

export function transformToRenewalTenure(items: RevenueRenewalTenureItem[]) {
  const dataMap = new Map<number, Map<RevenueRenewalTenureBucket, number>>();
  for (const item of items) {
    if (!dataMap.has(item.date)) dataMap.set(item.date, new Map());
    dataMap.get(item.date)!.set(item.tenureBucket, item.names);
  }
  const dates = Array.from(dataMap.keys()).sort((a, b) => a - b);

  return {
    xAxisLabels: dates.map((d) => formatMonthLabel(d)),
    series: TENURE_ORDER.map((bucket) => ({
      name: TENURE_LABELS[bucket],
      data: dates.map((d) => dataMap.get(d)?.get(bucket) ?? 0),
      color: TENURE_COLORS[bucket],
    })),
  };
}

export function transformToRenewalCohorts(
  items: RevenueRenewalFunnelItem[],
): Array<{ year: string; rate: number }> {
  const yearMap = new Map<number, { renewed: number; expiring: number }>();
  for (const item of items) {
    const year = new Date(item.date * 1000).getUTCFullYear();
    const prev = yearMap.get(year) ?? { renewed: 0, expiring: 0 };
    yearMap.set(year, {
      renewed: prev.renewed + item.renewedCount,
      expiring: prev.expiring + item.termsExpiring,
    });
  }
  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { renewed, expiring }]) => ({
      year: String(year),
      rate: expiring > 0 ? Math.round((renewed / expiring) * 100) : 0,
    }));
}

export function computeKpis(
  activeNames: RevenueActiveNamesItem[],
  newWallets: RevenueNewWalletsItem[],
  funnel: RevenueRenewalFunnelItem[],
  totals: RevenueTotalsItem[],
  actions: RevenueActionsItem[],
): KpiCard[] {
  const lastActive = activeNames[activeNames.length - 1];
  const lastWallet = newWallets[newWallets.length - 1];
  const prevWallet = newWallets[newWallets.length - 2];
  const lastFunnel = funnel[funnel.length - 1];
  const prevFunnel = funnel[funnel.length - 2];

  const totalReg = totals.reduce((s, i) => s + i.registrationUsd, 0);
  const totalRegActions = actions
    .filter((i) => i.category === "Registration")
    .reduce((s, i) => s + i.actions, 0);

  const walletDelta =
    lastWallet && prevWallet
      ? lastWallet.newWallets - prevWallet.newWallets
      : null;

  const renewalDelta =
    lastFunnel && prevFunnel
      ? lastFunnel.renewalRatePct - prevFunnel.renewalRatePct
      : null;

  return [
    {
      title: "Names registered",
      value: lastActive ? formatCompact(lastActive.cumulativeActive) : "—",
      subtext: lastActive
        ? `${lastActive.netChange >= 0 ? "+" : ""}${formatCompact(lastActive.netChange)} this month`
        : "—",
      trend: lastActive
        ? lastActive.netChange >= 0
          ? "up"
          : "down"
        : undefined,
    },
    {
      title: "New Wallets",
      value: lastWallet ? formatCompact(lastWallet.newWallets) : "—",
      subtext: lastWallet
        ? `this month (${formatCompact(lastWallet.cumulativeWallets)} all-time)`
        : "—",
      trend:
        walletDelta !== null ? (walletDelta >= 0 ? "up" : "down") : undefined,
    },
    {
      title: "Renewal Rate",
      value: lastFunnel ? `${lastFunnel.renewalRatePct.toFixed(0)}%` : "—",
      subtext:
        renewalDelta !== null
          ? `${renewalDelta >= 0 ? "+" : ""}${renewalDelta.toFixed(0)}pp vs last month`
          : "latest",
      trend:
        renewalDelta !== null ? (renewalDelta >= 0 ? "up" : "down") : undefined,
    },
    {
      title: "Avg. Revenue",
      value: totalRegActions > 0 ? formatUsd(totalReg / totalRegActions) : "—",
      subtext: "per registration, blended",
    },
  ];
}
