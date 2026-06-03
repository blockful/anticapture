import type { RevenueTotalsItem } from "@anticapture/client";

import { computeRevenueSummary } from "@/features/revenue/utils/transform";

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

describe("computeRevenueSummary", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("computes 1Y, YTD, and MAX actual revenue from the selected window", () => {
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

    expect(computeRevenueSummary(items, "1y")).toEqual({
      actualAmount: "$1K",
      runRate: "$1.4K",
      qoqDelta: {
        text: "+33% vs prior 3 months",
        trend: "up",
      },
    });
    expect(computeRevenueSummary(items, "ytd")).toEqual({
      actualAmount: "$690",
      runRate: "$1.4K",
      qoqDelta: {
        text: "+33% vs prior 3 months",
        trend: "up",
      },
    });
    expect(computeRevenueSummary(items, "max")).toEqual({
      actualAmount: "$1.1K",
      runRate: "$1.4K",
      qoqDelta: {
        text: "+33% vs prior 3 months",
        trend: "up",
      },
    });
  });

  it("excludes the in-progress month from run rate and includes it in actual revenue", () => {
    const items = [
      month(2025, 11, 100),
      month(2026, 0, 100),
      month(2026, 1, 100),
      month(2026, 2, 100),
      month(2026, 3, 100),
      month(2026, 4, 100),
      month(2026, 5, 5_000),
    ];

    expect(computeRevenueSummary(items, "1y")).toEqual({
      actualAmount: "$5.6K",
      runRate: "$1.2K",
      qoqDelta: undefined,
    });
  });

  it("reports negative QoQ deltas", () => {
    const items = [
      month(2025, 11, 200),
      month(2026, 0, 200),
      month(2026, 1, 200),
      month(2026, 2, 100),
      month(2026, 3, 100),
      month(2026, 4, 100),
    ];

    expect(computeRevenueSummary(items, "max")).toEqual({
      actualAmount: "$900",
      runRate: "$1.2K",
      qoqDelta: {
        text: "-50% vs prior 3 months",
        trend: "down",
      },
    });
  });

  it("omits QoQ for empty and short datasets", () => {
    expect(computeRevenueSummary([], "max")).toEqual({
      actualAmount: "$0",
      runRate: "$0",
      qoqDelta: undefined,
    });

    expect(
      computeRevenueSummary(
        [
          month(2026, 1, 100),
          month(2026, 2, 100),
          month(2026, 3, 100),
          month(2026, 4, 100),
          month(2026, 5, 100),
        ],
        "max",
      ),
    ).toEqual({
      actualAmount: "$500",
      runRate: "$1.2K",
      qoqDelta: undefined,
    });
  });
});
