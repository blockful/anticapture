import type { RevenueTotalsItem } from "@anticapture/client";

import {
  readRevenueMeta,
  resolveDataCutoff,
} from "@/features/revenue/utils/meta";
import {
  computeRevenueSummary,
  computeRunRate,
} from "@/features/revenue/utils/transform";
import {
  LIVE_AS_OF,
  liveTotals,
} from "@/features/revenue/utils/transform/fixtures/liveRevenue";

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

/** The totals response as the API returns it once `meta` ships. */
const liveResponse = {
  items: liveTotals,
  totalCount: liveTotals.length,
  meta: { asOf: LIVE_AS_OF, degraded: false },
};

const cutoffOf = (response: { items: unknown[] }) =>
  resolveDataCutoff(readRevenueMeta(response), new Date(), response.items);

describe("computeRevenueSummary on the live data (asOf 2026-09-23T00:09:06Z)", () => {
  const cutoff = cutoffOf(liveResponse);

  it("takes the data cutoff from meta.asOf", () => {
    expect(cutoff.toISOString()).toBe("2026-09-23T00:09:06.000Z");
  });

  it("annualizes average daily revenue of Jun-Aug 2026 (92 days)", () => {
    const runRate = computeRunRate(liveTotals, cutoff);
    const junToAug = 337_112.41 + 315_998.41 + 446_335.4; // 1,099,446.22

    expect(runRate.window.days).toBe(92);
    expect(runRate.averageDailyUsd).toBeCloseTo(junToAug / 92, 6);
    expect(runRate.annualizedUsd).toBeCloseTo(4_361_933.3728, 3);
  });

  it("compares average daily revenue with Mar-May 2026 (92 days)", () => {
    const runRate = computeRunRate(liveTotals, cutoff);
    const marToMay = 483_747.01 + 441_097.37 + 509_310.15; // 1,434,154.53

    expect(runRate.previousWindow.days).toBe(92);
    expect(runRate.previousAverageDailyUsd).toBeCloseTo(marToMay / 92, 6);
    expect(runRate.deltaPct).toBeCloseTo(-23.338371, 5);
  });

  it("renders the 1Y summary for Sep 2025 - Aug 2026", () => {
    const summary = computeRevenueSummary(liveTotals, "1y", cutoff);

    expect(summary.actualUsd).toBeCloseTo(6_015_077.48, 2);
    expect(summary).toMatchObject({
      actualAmount: "$6M",
      actualPeriod: "Sep 2025 to Aug 2026",
      runRate: "$4.4M",
      runRatePeriod: "Jun to Aug 2026",
      qoqDelta: {
        text: "-23% vs prior 3 months",
        trend: "down",
        previousPeriod: "Mar to May 2026",
      },
    });
  });

  it("YTD runs from Jan 1 of the cutoff's year to the cutoff", () => {
    const summary = computeRevenueSummary(liveTotals, "ytd", cutoff);

    expect(summary.actualUsd).toBeCloseTo(4_074_635.99, 2);
    expect(summary.actualAmount).toBe("$4.1M");
    expect(summary.actualPeriod).toBe("Jan 1, 2026 to Sep 23, 2026");
  });

  it("MAX sums every row up to the cutoff", () => {
    const summary = computeRevenueSummary(liveTotals, "max", cutoff);

    expect(summary.actualUsd).toBeCloseTo(17_395_815.19, 2);
    expect(summary.actualPeriod).toBe("Sep 2024 to Sep 23, 2026");
  });

  it("does not depend on the viewer's clock or the toggle", () => {
    jest.useFakeTimers();
    try {
      for (const now of ["2026-09-30T12:00:00Z", "2026-11-04T12:00:00Z"]) {
        jest.setSystemTime(new Date(now));
        const atView = cutoffOf(liveResponse);
        for (const timeframe of ["1y", "ytd", "max"] as const) {
          const summary = computeRevenueSummary(liveTotals, timeframe, atView);
          expect(summary.runRate).toBe("$4.4M");
          expect(summary.qoqDelta?.text).toBe("-23% vs prior 3 months");
        }
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps YTD on the cutoff's year when viewed in a new year", () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date("2027-01-15T12:00:00Z"));
      const summary = computeRevenueSummary(
        liveTotals,
        "ytd",
        cutoffOf(liveResponse),
      );
      expect(summary.actualUsd).toBeCloseTo(4_074_635.99, 2);
      expect(summary.actualPeriod).toBe("Jan 1, 2026 to Sep 23, 2026");
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("computeRevenueSummary without meta (older API)", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const olderResponse = { items: liveTotals, totalCount: liveTotals.length };

  it("infers the cutoff from the latest row, treating its month as partial", () => {
    for (const now of ["2026-10-29T12:00:00Z", "2026-11-04T12:00:00Z"]) {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(now));
      const cutoff = cutoffOf(olderResponse);
      // September 2026 is the latest row (it holds Sep 1-22 only).
      expect(cutoff.toISOString()).toBe("2026-09-30T23:59:59.999Z");

      // Jun-Aug 2026, as with meta: frozen data never adds $0 months or
      // treats the partial September as complete.
      const runRate = computeRunRate(liveTotals, cutoff);
      expect(runRate.annualizedUsd).toBeCloseTo(4_361_933.3728, 3);
      expect(runRate.deltaPct).toBeCloseTo(-23.338371, 5);
      jest.useRealTimers();
    }
  });

  it("names the latest month of data instead of a cutoff date", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-04T12:00:00Z"));
    const cutoff = cutoffOf(olderResponse);

    expect(
      computeRevenueSummary(liveTotals, "1y", cutoff, false),
    ).toMatchObject({
      actualPeriod: "Sep 2025 to Aug 2026",
      runRate: "$4.4M",
      runRatePeriod: "Jun to Aug 2026",
    });
    const ytd = computeRevenueSummary(liveTotals, "ytd", cutoff, false);
    expect(ytd.actualUsd).toBeCloseTo(4_074_635.99, 2);
    expect(ytd.actualPeriod).toBe("Jan 1, 2026 to the latest data (Sep 2026)");
    const max = computeRevenueSummary(liveTotals, "max", cutoff, false);
    expect(max.actualUsd).toBeCloseTo(17_395_815.19, 2);
    expect(max.actualPeriod).toBe("Sep 2024 to the latest data (Sep 2026)");
  });
});

describe("computeRevenueSummary on synthetic months", () => {
  const cutoff = new Date("2026-06-15T12:00:00Z");
  const items = [
    month(2025, 4, 10),
    month(2025, 5, 20),
    month(2025, 6, 30),
    month(2025, 7, 40),
    month(2025, 8, 50),
    month(2025, 9, 60),
    month(2025, 10, 70),
    month(2025, 11, 80),
    month(2026, 0, 90),
    month(2026, 1, 100),
    month(2026, 2, 110),
    month(2026, 3, 120),
    month(2026, 4, 130),
    month(2026, 5, 140),
  ];

  it("computes 1Y, YTD and MAX from calendar windows", () => {
    // 1Y: Jun 2025 - May 2026 (the partial June 2026 is excluded).
    expect(computeRevenueSummary(items, "1y", cutoff)).toMatchObject({
      actualUsd: 900,
      actualAmount: "$900",
      actualPeriod: "Jun 2025 to May 2026",
    });
    // YTD: Jan 1 - Jun 15, 2026, including the partial June.
    expect(computeRevenueSummary(items, "ytd", cutoff)).toMatchObject({
      actualUsd: 690,
      actualPeriod: "Jan 1, 2026 to Jun 15, 2026",
    });
    expect(computeRevenueSummary(items, "max", cutoff)).toMatchObject({
      actualUsd: 1050,
      actualAmount: "$1.1K",
    });
  });

  it("uses average daily revenue so 92- and 90-day windows compare fairly", () => {
    const runRate = computeRunRate(items, cutoff);

    // Mar-May 2026 (92 days) vs Dec 2025 - Feb 2026 (90 days).
    expect(runRate.window.days).toBe(92);
    expect(runRate.previousWindow.days).toBe(90);
    expect(runRate.annualizedUsd).toBeCloseTo((360 / 92) * 365, 10);
    expect(runRate.deltaPct).toBeCloseTo((360 / 92 / (270 / 90) - 1) * 100, 10);
    expect(computeRevenueSummary(items, "1y", cutoff)).toMatchObject({
      runRate: "$1.4K",
      runRatePeriod: "Mar to May 2026",
      qoqDelta: { text: "+30% vs prior 3 months", trend: "up" },
    });
  });

  it("treats a cutoff on a month boundary as covering the previous month", () => {
    const runRate = computeRunRate(items, new Date("2026-06-01T00:00:00Z"));
    expect(runRate.window.lastMonthStart).toBe(Date.UTC(2026, 4, 1) / 1000);
  });

  it("counts a missing month inside the history as $0", () => {
    const withGap = [
      month(2025, 11, 300),
      month(2026, 0, 300),
      month(2026, 1, 300),
      month(2026, 2, 300),
      // April 2026 missing
      month(2026, 4, 300),
    ];
    const runRate = computeRunRate(withGap, cutoff);

    expect(runRate.annualizedUsd).toBeCloseTo((600 / 92) * 365, 10);
    expect(runRate.deltaPct).toBeCloseTo((600 / 92 / (900 / 90) - 1) * 100, 10);
  });

  it("omits the delta when the data does not reach the previous window", () => {
    const short = [
      month(2026, 2, 100),
      month(2026, 3, 100),
      month(2026, 4, 100),
    ];
    const summary = computeRevenueSummary(short, "max", cutoff);

    expect(summary.runRateUsd).toBeCloseTo((300 / 92) * 365, 10);
    expect(summary.qoqDelta).toBeUndefined();
  });

  it("spells out the arithmetic behind the run rate and its delta", () => {
    const items = [
      month(2026, 1, 300),
      month(2026, 2, 300),
      month(2026, 3, 300),
      month(2026, 4, 9200),
      month(2026, 5, 9200),
      month(2026, 6, 9200),
    ];
    const summary = computeRevenueSummary(
      items,
      "max",
      new Date("2026-08-10T00:00:00Z"),
    );

    // May to Jul 2026 is 92 days; Feb to Apr 2026 is 89 days.
    expect(summary.runRateFormula).toBe("$27,600 ÷ 92 days × 365 = $109,500");
    expect(summary.qoqDelta?.formula).toBe("($300 ÷ $10 − 1) × 100");
  });

  it("returns zeros for an empty series (cards show Unavailable instead)", () => {
    expect(computeRevenueSummary([], "max", cutoff)).toMatchObject({
      actualUsd: 0,
      runRateUsd: 0,
      qoqDelta: undefined,
    });
  });
});
