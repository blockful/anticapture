import type { RevenueEnsv2DailyItem } from "@anticapture/client";

import {
  type Ensv2Kpi,
  ENSV2_LAUNCH_SECONDS,
  dailyLabelInterval,
  fullDays,
  summarizeEnsv2,
  toEnsv2Markers,
  transformToEnsv2Migration,
  transformToEnsv2Revenue,
} from "@/features/revenue/utils/transform/ensv2";
import {
  LIVE_ENSV2_AS_OF,
  liveEnsv2Daily,
} from "@/features/revenue/utils/transform/fixtures/liveEnsv2";

const asOf = new Date(LIVE_ENSV2_AS_OF);
const DAY = 86_400;

const byTitle = (kpis: Ensv2Kpi[], title: string): Ensv2Kpi => {
  const kpi = kpis.find((k) => k.title === title);
  if (!kpi) throw new Error(`missing KPI ${title}`);
  return kpi;
};

const day = (
  offset: number,
  overrides: Partial<RevenueEnsv2DailyItem> = {},
): RevenueEnsv2DailyItem => ({
  date: ENSV2_LAUNCH_SECONDS + offset * DAY,
  registrationUsd: 0,
  premiumUsd: 0,
  renewalUsd: 0,
  totalUsd: 0,
  cumulativeUsd: 0,
  registrations: 0,
  renewals: 0,
  renewalsUnmigrated: 0,
  namesMigrated: 0,
  cumulativeMigrated: 0,
  reservedNames: 1000,
  migratedPct: 0,
  ...overrides,
});

describe("summarizeEnsv2 on the live data (asOf 2026-11-19T15:28:04Z)", () => {
  const summary = summarizeEnsv2(liveEnsv2Daily, asOf, true);
  if (!summary) throw new Error("no summary");

  it("covers the launch day to the latest day of data", () => {
    expect(summary.period).toBe("Oct 27 to Nov 19, 2026");
  });

  it("Revenue: running total, and a daily average over the 23 full days", () => {
    const revenue = byTitle(summary.kpis, "Revenue since ENSv2");
    expect(revenue.value).toBe("$218.4K");
    expect(revenue.subtext).toBe("$9.2K per day over 23 full days");
    expect(revenue.tooltip).toContain("sum of daily revenue = $218,352");
    expect(revenue.tooltip).toContain("$211,420 ÷ 23 = $9,192");
    expect(revenue.tooltip).toContain(
      "Window: Oct 27, 2026 (ENSv2 launch) to Nov 19, 2026.",
    );
  });

  it("Names migrated: migrated ÷ reserved v1 names", () => {
    const migration = byTitle(summary.kpis, "Names migrated");
    expect(migration.value).toBe("3.40%");
    expect(migration.subtext).toBe("31.3K of 919.7K v1 names");
    expect(migration.tooltip).toContain("31,308 ÷ 919,728 × 100 = 3.40%");
  });

  it("New ENSv2 registrations: count and registration plus premium fees", () => {
    const registrations = byTitle(summary.kpis, "New ENSv2 registrations");
    expect(registrations.value).toBe("3.5K");
    expect(registrations.subtext).toBe("$80.6K in fees, premium included");
    expect(registrations.tooltip).toContain(
      "sum of daily registrations = 3,468",
    );
    expect(registrations.tooltip).toContain("= $80,565");
  });

  it("Renewals: count and the share made by names that have not migrated", () => {
    const renewals = byTitle(summary.kpis, "Renewals since ENSv2");
    expect(renewals.value).toBe("15.2K");
    expect(renewals.subtext).toBe("97% by names not migrated yet");
    expect(renewals.tooltip).toContain("14,782 ÷ 15,240 × 100 = 97%");
  });
});

describe("summarizeEnsv2 edge cases", () => {
  it("returns null without rows", () => {
    expect(summarizeEnsv2([], asOf, true)).toBeNull();
  });

  it("shows no average while the only day of data is still partial", () => {
    const cutoff = new Date((ENSV2_LAUNCH_SECONDS + 3600) * 1000);
    const summary = summarizeEnsv2(
      [day(0, { totalUsd: 50, cumulativeUsd: 50 })],
      cutoff,
      true,
    );
    const revenue = byTitle(summary?.kpis ?? [], "Revenue since ENSv2");
    expect(revenue.value).toBe("$50");
    expect(revenue.subtext).toBe("First day of data");
    expect(revenue.tooltip).not.toContain("Daily average");
  });

  it("never divides by zero: no reserved names, no renewals", () => {
    const summary = summarizeEnsv2(
      [day(0, { reservedNames: 0 }), day(1, { reservedNames: 0 })],
      new Date((ENSV2_LAUNCH_SECONDS + 2 * DAY) * 1000),
      true,
    );
    expect(byTitle(summary?.kpis ?? [], "Names migrated").value).toBe("—");
    expect(byTitle(summary?.kpis ?? [], "Renewals since ENSv2").subtext).toBe(
      "No renewals yet",
    );
  });

  it("does not depend on the order of the rows", () => {
    const reversed = [...liveEnsv2Daily].reverse();
    expect(summarizeEnsv2(reversed, asOf, true)).toEqual(
      summarizeEnsv2(liveEnsv2Daily, asOf, true),
    );
  });
});

describe("fullDays", () => {
  const rows = [day(0), day(1), day(2)];

  it("keeps the days that ended by the cutoff", () => {
    const cutoff = new Date((ENSV2_LAUNCH_SECONDS + 2 * DAY + 60) * 1000);
    expect(fullDays(rows, cutoff, true).map((r) => r.date)).toEqual([
      rows[0].date,
      rows[1].date,
    ]);
  });

  it("counts a day that ended exactly at the cutoff", () => {
    const cutoff = new Date((ENSV2_LAUNCH_SECONDS + 3 * DAY) * 1000);
    expect(fullDays(rows, cutoff, true)).toHaveLength(3);
  });

  it("treats the latest day as partial when the cutoff is unknown", () => {
    expect(fullDays(rows, new Date(), false)).toHaveLength(2);
  });
});

describe("ENSv2 chart series", () => {
  it("revenue: one stacked bar per stream and day, plus the running total", () => {
    const chart = transformToEnsv2Revenue(liveEnsv2Daily);
    expect(chart.xAxisLabels[0]).toBe("Oct 27");
    expect(chart.xAxisLabels).toHaveLength(24);
    expect(chart.barSeries.map((s) => s.name)).toEqual([
      "Registration",
      "Renewals",
      "Premium",
    ]);
    expect(new Set(chart.barSeries.map((s) => s.stack))).toEqual(
      new Set(["revenue"]),
    );
    // Oct 28: 8573.69 + 11808.69 + 0 = 20382.38
    expect(chart.barSeries.map((s) => s.data[1])).toEqual([
      8573.69, 11808.69, 0,
    ]);
    expect(chart.lineSeries[0].data[23]).toBe(218352.12);
  });

  it("migration: names per day and the migrated share", () => {
    const chart = transformToEnsv2Migration(liveEnsv2Daily);
    expect(chart.barSeries[0].data.slice(0, 2)).toEqual([4024, 10425]);
    expect(chart.lineSeries[0].data[23]).toBe(3.404);
    // The share never goes down.
    const share = chart.lineSeries[0].data;
    expect(share.every((v, i) => i === 0 || v >= share[i - 1])).toBe(true);
  });

  it("marks only events that fall on a charted day", () => {
    expect(toEnsv2Markers(liveEnsv2Daily)).toEqual([
      { xLabel: "Oct 27", label: "ENSv2 launch" },
    ]);
    expect(
      toEnsv2Markers(liveEnsv2Daily, [
        { date: ENSV2_LAUNCH_SECONDS + 400 * DAY, label: "Later" },
      ]),
    ).toEqual([]);
  });

  it("prints about eight x-axis labels", () => {
    const shown = (n: number) =>
      Array.from({ length: n }, (_, i) => i).filter(dailyLabelInterval(n))
        .length;
    expect(shown(24)).toBe(8);
    expect(shown(5)).toBe(5);
    expect(shown(400)).toBe(8);
  });
});
