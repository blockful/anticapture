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
import { code, paragraphs } from "@/features/revenue/utils/tooltipText";
import { sumBy } from "@/features/revenue/utils/window";

const SECONDS_PER_DAY = 86_400;

/**
 * The UTC day ENSv2 went live (block 26,282,117, at 06:01:59 UTC). It is the
 * first day of data and a partial one: nothing was paid on ENSv2 before 06:02.
 */
export const ENSV2_LAUNCH_SECONDS = Date.UTC(2026, 9, 27) / 1000;

/**
 * Dated events drawn on the migration chart as dashed lines, so a change in
 * the series can be read against what happened that day. `date` is the UTC
 * day start, in seconds. Add campaigns and protocol changes here; an event
 * outside the charted days is not drawn. The launch itself is not listed:
 * the charts start on it.
 */
export const ENSV2_EVENTS: { date: number; label: string }[] = [];

/** What ENSv2 revenue counts; shared by the ENSv2 tooltips. */
export const ENSV2_REVENUE_BASIS =
  "Counts registrations and premiums on the ENSv2 registrar and renewals on the ENSv2 registrar and on the v1 renewer (used by names that have not migrated), when paid, in USDC or DAI at face value.";

export type Ensv2Kpi = {
  title: string;
  value: string;
  subtext: string;
  /** Definition, formula with the real numbers, and window (see tooltipText.ts). */
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
 * Complete UTC days: after the launch day, and ended by the data cutoff.
 * Without a known cutoff the latest day is treated as partial, which is what
 * the API documents.
 */
export function fullDays(
  items: RevenueEnsv2DailyItem[],
  cutoff: Date,
  cutoffKnown: boolean,
): RevenueEnsv2DailyItem[] {
  const afterLaunch = byDate(items).filter(
    (item) => item.date > ENSV2_LAUNCH_SECONDS,
  );
  if (!cutoffKnown) return afterLaunch.slice(0, -1);
  const cutoffSeconds = cutoff.getTime() / 1000;
  return afterLaunch.filter(
    (item) => item.date + SECONDS_PER_DAY <= cutoffSeconds,
  );
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
  const completeUsd = sumBy(complete, (item) => item.totalUsd);
  const avgDailyUsd =
    complete.length > 0 ? completeUsd / complete.length : null;
  const revenue: Ensv2Kpi = {
    title: "Revenue since ENSv2",
    value: formatUsd(totalUsd),
    subtext:
      avgDailyUsd !== null
        ? `${formatUsd(avgDailyUsd)} per day over ${plural(complete.length, "full day")}`
        : "No full day of data yet",
    tooltip: paragraphs(
      ENSV2_REVENUE_BASIS,
      `Formula: ${code("sum of daily revenue")} = ${code(formatUsdExact(totalUsd))}`,
      avgDailyUsd !== null &&
        `Daily average: ${code("revenue of the full days ÷ full days")} = ${code(`${formatUsdExact(completeUsd)} ÷ ${complete.length} = ${formatUsdExact(avgDailyUsd)}`)}`,
      avgDailyUsd !== null &&
        "The launch day (ENSv2 went live at 06:02 UTC) and the latest day are partial, so the average leaves them out.",
      window,
    ),
  };

  // --- Migration
  const migrated = latest.cumulativeMigrated;
  const reserved = latest.reservedNames;
  const migratedPct = reserved > 0 ? (migrated / reserved) * 100 : null;
  const migration: Ensv2Kpi = {
    title: "Names migrated",
    value: migratedPct !== null ? formatPercent(migratedPct) : "—",
    subtext: `${formatCompact(migrated)} of ${formatCompact(reserved)} eligible v1 names`,
    tooltip: paragraphs(
      "Share of the v1 .eth names eligible to migrate that have moved to ENSv2. A name is migrated when a migration controller registers it in the ENSv2 registry. Migrating is not a payment and adds no revenue.",
      `Formula: ${code("migrated names ÷ eligible v1 names × 100")}`,
      migratedPct !== null &&
        code(
          `${formatInteger(migrated)} ÷ ${formatInteger(reserved)} × 100 = ${formatPercent(migratedPct)}`,
        ),
      "Eligible names are the v1 names the protocol reserved in the ENSv2 registry before the launch. That list is fixed. It includes names that had already expired but were still in their grace period, so it is larger than the active names count, and names that expire without migrating stay in it.",
      window,
    ),
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
    tooltip: paragraphs(
      "Names registered directly on ENSv2. A migrated v1 name is not a registration and is not counted here. A v1 name that expired and was registered again on ENSv2 is.",
      `Formula: ${code("sum of daily registrations")} = ${code(formatInteger(registrationCount))}`,
      `Fees: ${code("registration + premium")} = ${code(formatUsdExact(registrationUsd))}`,
      window,
    ),
  };

  return { period, kpis: [revenue, migration, registrations] };
}

/** About eight x-axis labels however many days are charted. */
export const dailyLabelInterval =
  (dayCount: number) =>
  (index: number): boolean =>
    index % Math.max(1, Math.ceil(dayCount / 8)) === 0;

/**
 * One label per charted day. Once the days span two calendar years the year
 * is added, so "Oct 27" of one year cannot be read as the other's.
 */
export function toDayLabels(sorted: RevenueEnsv2DailyItem[]): string[] {
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const withYear =
    first !== undefined &&
    last !== undefined &&
    new Date(first.date * 1000).getUTCFullYear() !==
      new Date(last.date * 1000).getUTCFullYear();
  return sorted.map((item) => formatDayLabel(item.date, withYear));
}

/** Events that fall on a charted day, as markers at that day's position. */
export function toEnsv2Markers(
  items: RevenueEnsv2DailyItem[],
  events: { date: number; label: string }[] = ENSV2_EVENTS,
): ComboChartMarker[] {
  const sorted = byDate(items);
  return events.flatMap((event) => {
    const index = sorted.findIndex((item) => item.date === event.date);
    return index === -1 ? [] : [{ index, label: event.label }];
  });
}

/** Daily revenue by stream, in the colours of the all-time revenue chart. */
export function transformToEnsv2Revenue(items: RevenueEnsv2DailyItem[]) {
  const sorted = byDate(items);
  return {
    xAxisLabels: toDayLabels(sorted),
    series: [
      {
        name: "Registration",
        data: sorted.map((item) => item.registrationUsd),
        color: "#0080bc",
      },
      {
        name: "Renewals",
        data: sorted.map((item) => item.renewalUsd),
        color: "#15803d",
      },
      {
        name: "Premium",
        data: sorted.map((item) => item.premiumUsd),
        color: "#f472b6",
      },
    ],
  };
}

/**
 * Names migrated per day (bars) and the migrated share of eligible v1 names
 * (line), in the colours of the other bar-and-line charts on the page.
 */
export function transformToEnsv2Migration(items: RevenueEnsv2DailyItem[]) {
  const sorted = byDate(items);
  return {
    xAxisLabels: toDayLabels(sorted),
    barSeries: [
      {
        name: "Names migrated (day)",
        valueFormatter: formatInteger,
        data: sorted.map((item) => item.namesMigrated),
        color: "#15803d",
      },
    ],
    lineSeries: [
      {
        name: "Migrated share of eligible names",
        valueFormatter: (value: number) => formatPercent(value),
        data: sorted.map((item) => item.migratedPct),
        color: "#0080bc",
        smooth: false,
      },
    ],
  };
}
