import type { RevenueEnsv2DailyItem } from "@anticapture/client";

import type { ComboChartMarker } from "@/shared/components/design-system/charts/types";

import {
  formatCompact,
  formatCutoffEnd,
  formatDayLabel,
  formatInteger,
  formatPercent,
  formatUsd,
  formatUsdExact,
  formatUtcDate,
} from "@/features/revenue/utils/format";
import { sumBy } from "@/features/revenue/utils/window";

const SECONDS_PER_DAY = 86_400;

/** ENSv2 went live in block 26,282,117, on Oct 27, 2026 at 06:01:59 UTC. */
export const ENSV2_LAUNCH_SECONDS = Date.UTC(2026, 9, 27) / 1000;

/**
 * Dated events drawn on the ENSv2 charts, so a change in the series can be
 * read against what happened that day. `date` is the UTC day start, in
 * seconds. Add campaigns and protocol changes here; an event outside the
 * charted days is not drawn.
 */
export const ENSV2_EVENTS: { date: number; label: string }[] = [
  { date: ENSV2_LAUNCH_SECONDS, label: "ENSv2 launch" },
];

/** What ENSv2 revenue counts; shared by the ENSv2 tooltips. */
export const ENSV2_REVENUE_BASIS =
  "Counts registrations and premiums on the ENSv2 registrar and renewals on the ENSv2 registrar and on the v1 renewer (used by names that have not migrated), when paid, in USDC or DAI at face value.";

export type Ensv2Kpi = {
  title: string;
  value: string;
  subtext: string;
  /** Definition, window and arithmetic, shown in the title's info tooltip. */
  tooltip: string;
};

export type Ensv2Summary = {
  /** "Oct 27 to Nov 19, 2026" */
  period: string;
  kpis: Ensv2Kpi[];
};

const byDate = (items: RevenueEnsv2DailyItem[]): RevenueEnsv2DailyItem[] =>
  [...items].sort((a, b) => a.date - b.date);

/**
 * Days that had ended by the data cutoff. Without a known cutoff the latest
 * day is treated as partial, which is what the API documents.
 */
export function fullDays(
  items: RevenueEnsv2DailyItem[],
  cutoff: Date,
  cutoffKnown: boolean,
): RevenueEnsv2DailyItem[] {
  const sorted = byDate(items);
  if (!cutoffKnown) return sorted.slice(0, -1);
  const cutoffSeconds = cutoff.getTime() / 1000;
  return sorted.filter((item) => item.date + SECONDS_PER_DAY <= cutoffSeconds);
}

const plural = (count: number, singular: string): string =>
  `${formatInteger(count)} ${singular}${count === 1 ? "" : "s"}`;

/**
 * Headline figures of the ENSv2 section. Every figure is a sum of the daily
 * rows or the latest row's running total; each tooltip shows the arithmetic.
 */
export function summarizeEnsv2(
  items: RevenueEnsv2DailyItem[],
  cutoff: Date,
  cutoffKnown: boolean,
): Ensv2Summary | null {
  const sorted = byDate(items);
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  if (!first || !latest) return null;

  const end = formatCutoffEnd(cutoff, cutoffKnown);
  const start = formatUtcDate(new Date(first.date * 1000));
  const period = `${formatDayLabel(first.date)} to ${formatUtcDate(new Date(latest.date * 1000))}`;
  const window = `Window: ${start} (ENSv2 launch) to ${end}.`;

  // --- Revenue. The running total is summed upstream before rounding, so it
  // is read from the rows instead of adding up the rounded daily figures.
  const totalUsd = latest.cumulativeUsd;
  const complete = fullDays(sorted, cutoff, cutoffKnown);
  const lastFullDay = complete[complete.length - 1];
  const completeUsd = lastFullDay ? lastFullDay.cumulativeUsd : 0;
  const avgDailyUsd =
    complete.length > 0 ? completeUsd / complete.length : null;
  const revenue: Ensv2Kpi = {
    title: "Revenue since ENSv2",
    value: formatUsd(totalUsd),
    subtext:
      avgDailyUsd !== null
        ? `${formatUsd(avgDailyUsd)} per day over ${plural(complete.length, "full day")}`
        : "First day of data",
    tooltip: `${ENSV2_REVENUE_BASIS} Formula: sum of daily revenue = ${formatUsdExact(totalUsd)}. ${window}${
      avgDailyUsd !== null
        ? ` Daily average = revenue of the full days ÷ full days: ${formatUsdExact(completeUsd)} ÷ ${complete.length} = ${formatUsdExact(avgDailyUsd)}. The latest day is partial and is left out of the average.`
        : ""
    }`,
  };

  // --- Migration
  const migrated = latest.cumulativeMigrated;
  const reserved = latest.reservedNames;
  const migratedPct = reserved > 0 ? (migrated / reserved) * 100 : null;
  const migration: Ensv2Kpi = {
    title: "Names migrated",
    value: migratedPct !== null ? formatPercent(migratedPct) : "—",
    subtext: `${formatCompact(migrated)} of ${formatCompact(reserved)} v1 names`,
    tooltip: `Share of v1 .eth names that moved to ENSv2. A name is migrated when a migration controller registers it in the ENSv2 registry; its expiry does not change and nothing is paid. The denominator is the v1 names reserved in the ENSv2 registry for migration, fixed since the launch. It includes names that have expired since without migrating, so the share cannot reach 100%. Formula: migrated names ÷ reserved v1 names × 100${
      migratedPct !== null
        ? `: ${formatInteger(migrated)} ÷ ${formatInteger(reserved)} × 100 = ${formatPercent(migratedPct)}`
        : ""
    }. ${window}`,
  };

  // --- Registrations
  const registrationCount = sumBy(sorted, (item) => item.registrations);
  const registrationUsd = sumBy(
    sorted,
    (item) => item.registrationUsd + item.premiumUsd,
  );
  const registrations: Ensv2Kpi = {
    title: "New ENSv2 registrations",
    value: formatCompact(registrationCount),
    subtext: `${formatUsd(registrationUsd)} in fees, premium included`,
    tooltip: `Names registered directly on ENSv2. Migrated v1 names are not registrations and are not counted here. A v1 name that expired and was registered again on ENSv2 counts. Formula: sum of daily registrations = ${formatInteger(registrationCount)}; fees = registration + premium = ${formatUsdExact(registrationUsd)}. ${window}`,
  };

  // --- Renewals
  const renewalCount = sumBy(sorted, (item) => item.renewals);
  const unmigratedCount = sumBy(sorted, (item) => item.renewalsUnmigrated);
  const unmigratedShare =
    renewalCount > 0 ? (unmigratedCount / renewalCount) * 100 : null;
  const renewals: Ensv2Kpi = {
    title: "Renewals since ENSv2",
    value: formatCompact(renewalCount),
    subtext:
      unmigratedShare !== null
        ? `${formatPercent(unmigratedShare, 0)} by names not migrated yet`
        : "No renewals yet",
    tooltip: `Paid renewals since the ENSv2 launch. A v1 name can be renewed without migrating, through the v1 renewer; a migrated or ENSv2-registered name renews on the ENSv2 registrar. Formula: share by names not migrated = renewals through the v1 renewer ÷ all renewals × 100${
      unmigratedShare !== null
        ? `: ${formatInteger(unmigratedCount)} ÷ ${formatInteger(renewalCount)} × 100 = ${formatPercent(unmigratedShare, 0)}`
        : ""
    }. ${window}`,
  };

  return { period, kpis: [revenue, migration, registrations, renewals] };
}

/** About eight x-axis labels however many days are charted. */
export const dailyLabelInterval =
  (dayCount: number) =>
  (index: number): boolean =>
    index % Math.max(1, Math.ceil(dayCount / 8)) === 0;

/** Events that fall on a charted day, as markers on that day's label. */
export function toEnsv2Markers(
  items: RevenueEnsv2DailyItem[],
  events: { date: number; label: string }[] = ENSV2_EVENTS,
): ComboChartMarker[] {
  const charted = new Set(items.map((item) => item.date));
  return events
    .filter((event) => charted.has(event.date))
    .map((event) => ({
      xLabel: formatDayLabel(event.date),
      label: event.label,
    }));
}

/** Daily revenue by stream (stacked bars) and the running total (line). */
export function transformToEnsv2Revenue(items: RevenueEnsv2DailyItem[]) {
  const sorted = byDate(items);
  return {
    xAxisLabels: sorted.map((item) => formatDayLabel(item.date)),
    barSeries: [
      {
        name: "Registration",
        valueFormatter: formatUsdExact,
        data: sorted.map((item) => item.registrationUsd),
        color: "#0080bc",
        stack: "revenue",
      },
      {
        name: "Renewals",
        valueFormatter: formatUsdExact,
        data: sorted.map((item) => item.renewalUsd),
        color: "#15803d",
        stack: "revenue",
      },
      {
        name: "Premium",
        valueFormatter: formatUsdExact,
        data: sorted.map((item) => item.premiumUsd),
        color: "#f472b6",
        stack: "revenue",
      },
    ],
    lineSeries: [
      {
        name: "Cumulative revenue",
        valueFormatter: formatUsdExact,
        data: sorted.map((item) => item.cumulativeUsd),
        color: "#f59e0b",
        smooth: false,
      },
    ],
  };
}

/** Names migrated per day (bars) and the migrated share of v1 names (line). */
export function transformToEnsv2Migration(items: RevenueEnsv2DailyItem[]) {
  const sorted = byDate(items);
  return {
    xAxisLabels: sorted.map((item) => formatDayLabel(item.date)),
    barSeries: [
      {
        name: "Names migrated (day)",
        valueFormatter: formatInteger,
        data: sorted.map((item) => item.namesMigrated),
        color: "#a855f7",
      },
    ],
    lineSeries: [
      {
        name: "Migrated share of v1 names",
        valueFormatter: (value: number) => formatPercent(value),
        data: sorted.map((item) => item.migratedPct),
        color: "#f59e0b",
        smooth: false,
      },
    ],
  };
}
