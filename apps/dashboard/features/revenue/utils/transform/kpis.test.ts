import type { RevenueTotalsItem } from "@anticapture/client";

import type { KpiCard } from "@/features/revenue/types";
import { inferCutoffFromRows } from "@/features/revenue/utils/meta";
import {
  computeKpis,
  type KpiSeries,
} from "@/features/revenue/utils/transform";
import {
  LIVE_AS_OF,
  liveNewWallets,
  liveRenewalFunnel,
  liveTotals,
} from "@/features/revenue/utils/transform/fixtures/liveRevenue";
import type { KpiWindow } from "@/features/revenue/utils/window";

const ONE_YEAR: KpiWindow = { months: 12, label: "1Y" };
const THREE_MONTHS: KpiWindow = { months: 3, label: "3M" };
const THREE_YEARS: KpiWindow = { months: 36, label: "3Y" };
const MAX: KpiWindow = { months: null, label: "MAX" };

const asOf = new Date(LIVE_AS_OF);
const series = <T>(items: T[], unavailable = false): KpiSeries<T> => ({
  items,
  cutoff: asOf,
  unavailable,
});

const liveKpis = (window: KpiWindow) =>
  computeKpis(
    {
      newWallets: series(liveNewWallets),
      funnel: series(liveRenewalFunnel),
      totals: series(liveTotals),
    },
    window,
  );

const byTitle = (cards: KpiCard[], title: string): KpiCard => {
  const card = cards.find((c) => c.title === title);
  if (!card) throw new Error(`missing KPI ${title}`);
  return card;
};

describe("computeKpis on the live data (asOf 2026-09-23T00:09:06Z)", () => {
  it("1Y: Revenue and New Wallets cover Sep 2025 - Aug 2026", () => {
    const cards = liveKpis(ONE_YEAR);

    // Revenue: 6,015,077.48 vs 11,122,297.76 (Sep 2024 - Aug 2025) = -45.9%.
    expect(byTitle(cards, "Revenue")).toMatchObject({
      value: "$6M",
      delta: { value: "-46", unit: "%", comparison: "vs prev. 1Y" },
      trend: "down",
    });
    // New Wallets: 24,590 vs 78,934 = -68.8%.
    expect(byTitle(cards, "New Wallets")).toMatchObject({
      value: "24.6K",
      delta: { value: "-69", unit: "%", comparison: "vs prev. 1Y" },
      trend: "down",
    });
    for (const title of ["Revenue", "New Wallets"]) {
      expect(byTitle(cards, title).tooltip).toContain(
        "Window: Sep 2025 to Aug 2026 (12 full months before the data cutoff, Sep 23, 2026), compared with Sep 2024 to Aug 2025.",
      );
    }
  });

  it("1Y: Renewal Rate ends 90 days before the cutoff (Jun 2025 - May 2026)", () => {
    const renewal = byTitle(liveKpis(ONE_YEAR), "Renewal Rate");

    // 334,177 / 797,529 = 41.90% vs 278,599 / 899,475 = 30.97%: +10.93pp.
    expect(renewal).toMatchObject({
      value: "42%",
      delta: { value: "+11", unit: "pp", comparison: "vs prev. 1Y" },
      trend: "up",
    });
    expect(renewal.tooltip).toContain("Window: Jun 2025 to May 2026");
    expect(renewal.tooltip).toContain(
      "of expiry dates before Jun 25, 2026, whose grace period ended by the data cutoff, Sep 23, 2026",
    );
    expect(renewal.tooltip).toContain("compared with Jun 2024 to May 2025.");
  });

  it("3M: Revenue matches the run-rate windows; Renewal Rate shifts by 90 days", () => {
    const cards = liveKpis(THREE_MONTHS);

    // 1,099,446.22 (Jun-Aug 2026) vs 1,434,154.53 (Mar-May 2026).
    expect(byTitle(cards, "Revenue")).toMatchObject({
      value: "$1.1M",
      delta: { value: "-23", unit: "%" },
    });
    // Mar-May 2026 cohorts 43.97% vs Dec 2025 - Feb 2026 43.35%.
    expect(byTitle(cards, "Renewal Rate")).toMatchObject({
      value: "44%",
      delta: { value: "+0.6", unit: "pp" },
    });
    expect(byTitle(cards, "Renewal Rate").tooltip).toContain(
      "Window: Mar to May 2026",
    );
  });

  it("omits the delta when the data does not cover the previous window", () => {
    const revenue = byTitle(liveKpis(THREE_YEARS), "Revenue");

    expect(revenue.delta).toBeUndefined();
    expect(revenue.subtext).toBe("since Sep 2024");
    expect(revenue.tooltip).toContain(
      "The data does not cover an earlier window to compare with.",
    );
  });

  it("MAX sums every row up to the cutoff without a delta", () => {
    const revenue = byTitle(liveKpis(MAX), "Revenue");

    expect(revenue).toMatchObject({
      value: "$17.4M",
      subtext: "since Sep 2024",
    });
    expect(revenue.delta).toBeUndefined();
    expect(revenue.tooltip).toContain(
      "Window: all data, Sep 2024 to Sep 23, 2026.",
    );
  });
});

describe("computeKpis windows", () => {
  const month = (
    year: number,
    zeroIndexedMonth: number,
    totalUsd: number,
  ): RevenueTotalsItem => ({
    date: Date.UTC(year, zeroIndexedMonth, 1) / 1000,
    registrationUsd: totalUsd,
    renewalUsd: 0,
    premiumUsd: 0,
    totalUsd,
    registrationEth: 0,
    renewalEth: 0,
    premiumEth: 0,
  });

  it("uses calendar months, not the last N rows, and counts gaps as zero", () => {
    // Rows for Jan-Mar 2026 and Jul 2026 only; cutoff Aug 10, 2026.
    const totals = [
      month(2026, 0, 100),
      month(2026, 1, 100),
      month(2026, 2, 100),
      month(2026, 6, 50),
      month(2026, 7, 999),
    ];
    const cards = computeKpis(
      {
        newWallets: series([]),
        funnel: series([]),
        totals: {
          items: totals,
          cutoff: new Date("2026-08-10T00:00:00Z"),
          unavailable: false,
        },
      },
      THREE_MONTHS,
    );

    // May-Jul 2026 = 0 + 0 + 50, vs Feb-Apr 2026 = 100 + 100 + 0.
    expect(byTitle(cards, "Revenue")).toMatchObject({
      value: "$50",
      delta: { value: "-75", unit: "%" },
    });
  });

  it("marks a KPI Unavailable when its own series is unavailable", () => {
    const cards = computeKpis(
      {
        newWallets: series(liveNewWallets),
        funnel: series([], true),
        totals: series(liveTotals),
      },
      ONE_YEAR,
    );

    expect(byTitle(cards, "Renewal Rate")).toMatchObject({
      value: "Unavailable",
      unavailable: true,
    });
    expect(byTitle(cards, "Renewal Rate").delta).toBeUndefined();
    expect(byTitle(cards, "Revenue").value).toBe("$6M");
  });
});

describe("computeKpis without meta (older API)", () => {
  // Cutoffs inferred from each series' latest row, as toRevenueDataState
  // does: Sep 2026 for totals and new wallets, the Jun 2026 cohort for the
  // funnel (the API only returns cohorts whose grace period has ended).
  const inferred = <T extends { date: number }>(items: T[]): KpiSeries<T> => ({
    items,
    cutoff: inferCutoffFromRows(items, new Date("2026-11-04T12:00:00Z"))!,
    unavailable: false,
    cutoffKnown: false,
  });

  it("matches the windows computed with meta and names no cutoff date", () => {
    const cards = computeKpis(
      {
        newWallets: inferred(liveNewWallets),
        funnel: inferred(liveRenewalFunnel),
        totals: inferred(liveTotals),
      },
      ONE_YEAR,
    );

    expect(byTitle(cards, "Revenue")).toMatchObject({
      value: "$6M",
      delta: { value: "-46" },
    });
    expect(byTitle(cards, "New Wallets").value).toBe("24.6K");
    expect(byTitle(cards, "Revenue").tooltip).toContain(
      "Window: Sep 2025 to Aug 2026 (12 full months before Sep 2026, the latest month of data, which may be partial)",
    );
    const renewal = byTitle(cards, "Renewal Rate");
    expect(renewal).toMatchObject({ value: "42%", delta: { value: "+11" } });
    expect(renewal.tooltip).toContain("Window: Jun 2025 to May 2026");
    expect(renewal.tooltip).toContain(
      "of expiry dates before Jun 2026, the latest expiry month in the data",
    );
    expect(renewal.tooltip).not.toMatch(/Nov 4|data cutoff/);
  });
});
