import type {
  RevenueRenewalTenureBucket,
  RevenueRenewalTenureItem,
  RevenueTotalsItem,
} from "@anticapture/client";

import {
  transformToOverview,
  transformToRenewalTenure,
  transformToStreamSeries,
} from "@/features/revenue/utils/transform";

const item = (
  year: number,
  zeroIndexedMonth: number,
  registrationUsd: number,
  renewalUsd: number,
  premiumUsd: number,
): RevenueTotalsItem => ({
  date: Date.UTC(year, zeroIndexedMonth, 1) / 1000,
  registrationUsd,
  renewalUsd,
  premiumUsd,
  totalUsd: registrationUsd + renewalUsd + premiumUsd,
  registrationEth: 0,
  renewalEth: 0,
  premiumEth: 0,
});

describe("transformToStreamSeries", () => {
  it("buckets full history into UTC calendar quarters", () => {
    const result = transformToStreamSeries(
      [
        item(2019, 0, 1, 10, 100),
        item(2019, 1, 2, 20, 200),
        item(2019, 3, 3, 30, 300),
        item(2020, 6, 4, 40, 400),
        item(2026, 4, 5, 50, 500),
      ],
      "quarter",
    );

    expect(result).toEqual({
      xAxisLabels: ["Q1 '19", "Q2 '19", "Q3 '20", "Q2 '26"],
      series: [
        {
          name: "Registration",
          data: [3, 3, 4, 5],
          color: "#0080bc",
        },
        {
          name: "Renewals",
          data: [30, 30, 40, 50],
          color: "#15803d",
        },
        {
          name: "Premium",
          data: [300, 300, 400, 500],
          color: "#f472b6",
        },
      ],
    });
  });

  it("buckets full history into UTC years", () => {
    const result = transformToStreamSeries(
      [
        item(2019, 0, 1, 10, 100),
        item(2019, 11, 2, 20, 200),
        item(2020, 0, 3, 30, 300),
      ],
      "year",
    );

    expect(result).toEqual({
      xAxisLabels: ["2019", "2020"],
      series: [
        {
          name: "Registration",
          data: [3, 3],
          color: "#0080bc",
        },
        {
          name: "Renewals",
          data: [30, 30],
          color: "#15803d",
        },
        {
          name: "Premium",
          data: [300, 300],
          color: "#f472b6",
        },
      ],
    });
  });

  it("keeps monthly labels and per-item values for month granularity", () => {
    const result = transformToStreamSeries(
      [item(2026, 0, 1, 10, 100), item(2026, 1, 2, 20, 200)],
      "month",
    );

    expect(result).toEqual({
      xAxisLabels: ["Jan 2026", "Feb 2026"],
      series: [
        {
          name: "Registration",
          data: [1, 2],
          color: "#0080bc",
        },
        {
          name: "Renewals",
          data: [10, 20],
          color: "#15803d",
        },
        {
          name: "Premium",
          data: [100, 200],
          color: "#f472b6",
        },
      ],
    });
  });
});

describe("transformToRenewalTenure", () => {
  const tenure = (
    year: number,
    zeroIndexedMonth: number,
    tenureBucket: RevenueRenewalTenureBucket,
    names: number,
  ): RevenueRenewalTenureItem => ({
    date: Date.UTC(year, zeroIndexedMonth, 1) / 1000,
    tenureBucket,
    names,
    totalRenewalsInBucket: 0,
  });

  const items = [
    tenure(2026, 7, "0 renewals (one-shot)", 1), // before the cutoff's month
    tenure(2026, 8, "0 renewals (one-shot)", 10), // cutoff's month
    tenure(2026, 8, "1 renewal", 500),
    tenure(2027, 7, "0 renewals (one-shot)", 20), // 12th month
    tenure(2027, 8, "0 renewals (one-shot)", 300), // 13th month
  ];

  it("counts never-renewed names in the 12 months from the data cutoff", () => {
    const result = transformToRenewalTenure(
      items,
      new Date("2026-09-23T00:09:06Z"),
    );

    expect(result.neverRenewedNext12mo).toBe(30);
    expect(result.next12moPeriod).toBe("Sep 2026 to Aug 2027");
  });

  it("does not move with the viewer's clock", () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date("2027-01-15T00:00:00Z"));
      expect(
        transformToRenewalTenure(items, new Date("2026-09-23T00:09:06Z"))
          .neverRenewedNext12mo,
      ).toBe(30);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("transformToOverview", () => {
  it("labels the all-time period up to the data cutoff", () => {
    const overview = transformToOverview(
      [item(2019, 4, 100, 50, 0), item(2026, 8, 300, 200, 100)],
      [
        {
          date: Date.UTC(2026, 8, 1) / 1000,
          category: "Registration",
          actions: 10,
        },
        { date: Date.UTC(2026, 8, 1) / 1000, category: "Premium", actions: 2 },
      ],
      new Date("2026-09-23T00:09:06Z"),
    );

    expect(overview.period).toBe("May 2019 to Sep 23, 2026");
    expect(
      transformToOverview(
        [item(2019, 4, 100, 50, 0), item(2026, 8, 300, 200, 100)],
        [],
        new Date("2026-09-30T23:59:59.999Z"),
        false,
      ).period,
    ).toBe("May 2019 to the latest data (Sep 2026)");
    expect(overview.streams.map((s) => [s.name, s.amount, s.volume])).toEqual([
      ["Registration", "$400", "10 registrations"],
      ["Renewals", "$250", "0 renewals"],
      ["Premium", "$100", "2 premium sales"],
    ]);
    // Registration revenue includes the base fee of premium registrations, so
    // its average divides by registrations plus premium sales: $400 / 12.
    expect(overview.streams.map((s) => s.avgRevenue)).toEqual([
      "$33 avg",
      "— avg",
      "$50 avg",
    ]);
  });
});
