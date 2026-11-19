import type { RevenueEnsv2DailyItem } from "@anticapture/client";

import {
  type Ensv2Kpi,
  ENSV2_LAUNCH_SECONDS,
  dailyLabelInterval,
  fullDays,
  summarizeEnsv2,
  toDayLabels,
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

describe("summarizeEnsv2 on the live data (asOf 2026-11-19T15:50:49Z)", () => {
  const summary = summarizeEnsv2(liveEnsv2Daily, asOf, true);
  if (!summary) throw new Error("no summary");

  it("covers the launch day to the latest day of data", () => {
    expect(summary.period).toBe("Oct 27 to Nov 19, 2026");
  });

  it("Revenue: running total, and a daily average over the 22 full days", () => {
    const revenue = byTitle(summary.kpis, "Revenue since ENSv2");
    expect(revenue.value).toBe("$218.4K");
    // Oct 28 to Nov 18: neither the launch day nor the latest day.
    expect(revenue.subtext).toBe("$8.9K per day over 22 full days");
    expect(revenue.tooltip).toContain("`sum of daily revenue` = `$218,371`");
    expect(revenue.tooltip).toContain("`$196,450 ÷ 22 = $8,930`");
    expect(revenue.tooltip).toContain(
      "Window: Oct 27, 2026 (ENSv2 launch) to Nov 19, 2026.",
    );
  });

  it("Names migrated: migrated ÷ reserved v1 names", () => {
    const migration = byTitle(summary.kpis, "Names migrated");
    expect(migration.value).toBe("3.40%");
    expect(migration.subtext).toBe("31.3K of 919.7K eligible v1 names");
    expect(migration.tooltip).toContain("`31,310 ÷ 919,728 × 100 = 3.40%`");
  });

  it("New ENSv2 registrations: count and registration plus premium fees", () => {
    const registrations = byTitle(summary.kpis, "New ENSv2 registrations");
    expect(registrations.value).toBe("3.5K");
    expect(registrations.subtext).toBe("$80.6K in fees, premium included");
    expect(registrations.tooltip).toContain(
      "`sum of daily registrations` = `3,471`",
    );
    expect(registrations.tooltip).toContain(
      "`registration + premium` = `$80,582`",
    );
  });

  it("shows three figures: revenue, migration and registrations", () => {
    expect(summary.kpis.map((kpi) => kpi.title)).toEqual([
      "Revenue since ENSv2",
      "Names migrated",
      "New ENSv2 registrations",
    ]);
  });

  it("writes every tooltip as paragraphs, the window last", () => {
    for (const kpi of summary.kpis) {
      const blocks = kpi.tooltip.split("\n\n");
      expect(blocks.length).toBeGreaterThanOrEqual(3);
      expect(blocks[blocks.length - 1]).toMatch(/^Window: /);
    }
  });
});

describe("summarizeEnsv2 edge cases", () => {
  it("returns null without rows", () => {
    expect(summarizeEnsv2([], asOf, true)).toBeNull();
  });

  it("shows no average while there is no full day of data", () => {
    // Launch day and one more day, the cutoff an hour into the second.
    const cutoff = new Date((ENSV2_LAUNCH_SECONDS + DAY + 3600) * 1000);
    const summary = summarizeEnsv2(
      [
        day(0, { totalUsd: 50, cumulativeUsd: 50 }),
        day(1, { totalUsd: 5, cumulativeUsd: 55 }),
      ],
      cutoff,
      true,
    );
    const revenue = byTitle(summary?.kpis ?? [], "Revenue since ENSv2");
    expect(revenue.value).toBe("$55");
    expect(revenue.subtext).toBe("No full day of data yet");
    expect(revenue.tooltip).not.toContain("Daily average");
  });

  it("averages only complete days after the launch day", () => {
    // Days 1 and 2 are complete; day 0 is the launch day, day 3 is partial.
    const cutoff = new Date((ENSV2_LAUNCH_SECONDS + 3 * DAY + 60) * 1000);
    const summary = summarizeEnsv2(
      [
        day(0, { totalUsd: 1000, cumulativeUsd: 1000 }),
        day(1, { totalUsd: 100, cumulativeUsd: 1100 }),
        day(2, { totalUsd: 300, cumulativeUsd: 1400 }),
        day(3, { totalUsd: 7, cumulativeUsd: 1407 }),
      ],
      cutoff,
      true,
    );
    const revenue = byTitle(summary?.kpis ?? [], "Revenue since ENSv2");
    expect(revenue.value).toBe("$1.4K");
    expect(revenue.subtext).toBe("$200 per day over 2 full days");
    expect(revenue.tooltip).toContain("`$400 ÷ 2 = $200`");
  });

  it("never divides by zero when no name was reserved", () => {
    const summary = summarizeEnsv2(
      [day(0, { reservedNames: 0 }), day(1, { reservedNames: 0 })],
      new Date((ENSV2_LAUNCH_SECONDS + 2 * DAY) * 1000),
      true,
    );
    expect(byTitle(summary?.kpis ?? [], "Names migrated").value).toBe("—");
  });

  it("does not depend on the order of the rows", () => {
    const reversed = [...liveEnsv2Daily].reverse();
    expect(summarizeEnsv2(reversed, asOf, true)).toEqual(
      summarizeEnsv2(liveEnsv2Daily, asOf, true),
    );
  });
});

describe("fullDays", () => {
  const rows = [day(0), day(1), day(2), day(3)];

  it("keeps the days after the launch day that ended by the cutoff", () => {
    const cutoff = new Date((ENSV2_LAUNCH_SECONDS + 3 * DAY + 60) * 1000);
    expect(fullDays(rows, cutoff, true).map((r) => r.date)).toEqual([
      rows[1].date,
      rows[2].date,
    ]);
  });

  it("counts a day that ended exactly at the cutoff", () => {
    const cutoff = new Date((ENSV2_LAUNCH_SECONDS + 4 * DAY) * 1000);
    expect(fullDays(rows, cutoff, true)).toHaveLength(3);
  });

  it("treats the latest day as partial when the cutoff is unknown", () => {
    expect(fullDays(rows, new Date(), false).map((r) => r.date)).toEqual([
      rows[1].date,
      rows[2].date,
    ]);
  });
});

describe("ENSv2 chart series", () => {
  it("revenue: one stacked bar per stream and day, in the all-time chart's colours", () => {
    const chart = transformToEnsv2Revenue(liveEnsv2Daily);
    expect(chart.xAxisLabels[0]).toBe("Oct 27");
    expect(chart.xAxisLabels).toHaveLength(24);
    expect(chart.series.map((s) => [s.name, s.color])).toEqual([
      ["Registration", "#0080bc"],
      ["Renewals", "#15803d"],
      ["Premium", "#f472b6"],
    ]);
    // Oct 28: 8573.69 + 11808.69 + 0 = 20382.38
    expect(chart.series.map((s) => s.data[1])).toEqual([8573.69, 11808.69, 0]);
  });

  it("migration: names per day and the migrated share", () => {
    const chart = transformToEnsv2Migration(liveEnsv2Daily);
    expect(chart.barSeries[0].data.slice(0, 2)).toEqual([4024, 10425]);
    expect(chart.lineSeries[0].data[23]).toBe(3.4043);
    // The share never goes down.
    const share = chart.lineSeries[0].data;
    expect(share.every((v, i) => i === 0 || v >= share[i - 1])).toBe(true);
  });

  it("draws no marker by default: the charts start on the launch", () => {
    expect(toEnsv2Markers(liveEnsv2Daily)).toEqual([]);
  });

  it("marks an event at the position of its day, and only if it is charted", () => {
    expect(
      toEnsv2Markers(liveEnsv2Daily, [
        { date: ENSV2_LAUNCH_SECONDS + 3 * DAY, label: "Campaign" },
        { date: ENSV2_LAUNCH_SECONDS + 400 * DAY, label: "Later" },
      ]),
    ).toEqual([{ index: 3, label: "Campaign" }]);
  });

  it("adds the year to the day labels once the series spans two years", () => {
    expect(toDayLabels(liveEnsv2Daily).slice(0, 2)).toEqual([
      "Oct 27",
      "Oct 28",
    ]);
    const intoNextYear = [day(0), day(66), day(365)];
    expect(toDayLabels(intoNextYear)).toEqual([
      "Oct 27 '26",
      "Jan 1 '27",
      "Oct 27 '27",
    ]);
    // The second "Oct 27" is a different label and a different position.
    expect(
      toEnsv2Markers(intoNextYear, [
        { date: ENSV2_LAUNCH_SECONDS, label: "ENSv2 launch" },
      ]),
    ).toEqual([{ index: 0, label: "ENSv2 launch" }]);
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
