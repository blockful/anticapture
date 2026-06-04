import type { RevenueTotalsItem } from "@anticapture/client";

import { transformToStreamSeries } from "@/features/revenue/utils/transform";

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
