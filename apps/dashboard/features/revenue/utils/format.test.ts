import {
  formatCompact,
  formatDayLabel,
  formatInteger,
  formatMillions,
  formatMonthRange,
  formatPercent,
  formatUsd,
  formatUtcDateTime,
} from "@/features/revenue/utils/format";

describe("formatUsd", () => {
  it.each([
    [0, "$0"],
    [23.98, "$24"],
    [999.4, "$999"],
    [999.6, "$1K"],
    [1_500, "$1.5K"],
    [999_949, "$999.9K"],
    [999_950, "$1M"],
    [4_361_933.37, "$4.4M"],
    [6_015_077.48, "$6M"],
    [999_960_000, "$1B"],
    [1_234_567_890, "$1.2B"],
  ])("formats %p as %p", (value, expected) => {
    expect(formatUsd(value)).toBe(expected);
  });

  it.each([
    [-5, "-$5"],
    [-1_500, "-$1.5K"],
    [-999_950, "-$1M"],
    [-0.2, "$0"],
  ])("formats negative %p as %p", (value, expected) => {
    expect(formatUsd(value)).toBe(expected);
  });
});

describe("formatCompact", () => {
  it.each([
    [0, "0"],
    [5, "5"],
    [-5, "-5"],
    [999, "999"],
    [1_500, "1.5K"],
    [24_590, "24.6K"],
    [999_960, "1M"],
    [834_170, "834.2K"],
    [1_250_000, "1.25M"],
    [999_999_999, "1B"],
    [1_250_000_000, "1.25B"],
    [-1_500, "-1.5K"],
  ])("formats %p as %p", (value, expected) => {
    expect(formatCompact(value)).toBe(expected);
  });
});

describe("formatMillions", () => {
  it.each([
    [0, "$0"],
    [-5, "-$5"],
    [250_000, "$250K"],
    [999_500, "$1M"],
    [1_500_000, "$1.5M"],
    [999_999_999, "$1B"],
    [-250_000, "-$250K"],
  ])("formats %p as %p", (value, expected) => {
    expect(formatMillions(value)).toBe(expected);
  });
});

describe("date labels", () => {
  const monthStart = (year: number, month: number) =>
    Date.UTC(year, month, 1) / 1000;

  it("formats month ranges", () => {
    expect(formatMonthRange(monthStart(2026, 5), monthStart(2026, 7))).toBe(
      "Jun to Aug 2026",
    );
    expect(formatMonthRange(monthStart(2025, 8), monthStart(2026, 7))).toBe(
      "Sep 2025 to Aug 2026",
    );
    expect(formatMonthRange(monthStart(2026, 7), monthStart(2026, 7))).toBe(
      "Aug 2026",
    );
  });

  it("formats the data cutoff in UTC", () => {
    expect(formatUtcDateTime(new Date("2026-09-23T00:09:06Z"))).toBe(
      "Sep 23, 2026, 00:09 UTC",
    );
  });
});

describe("formatDayLabel", () => {
  const oct27 = Date.UTC(2026, 9, 27) / 1000;

  it("prints the UTC month and day", () => {
    expect(formatDayLabel(oct27)).toBe("Oct 27");
    // 23:59:59 UTC is still the same UTC day, whatever the local zone.
    expect(formatDayLabel(oct27 + 86_399)).toBe("Oct 27");
    expect(formatDayLabel(oct27 + 86_400)).toBe("Oct 28");
  });

  it("adds a two-digit year on request", () => {
    expect(formatDayLabel(oct27, true)).toBe("Oct 27 '26");
    expect(formatDayLabel(Date.UTC(2027, 0, 1) / 1000, true)).toBe("Jan 1 '27");
  });
});

describe("formatInteger and formatPercent", () => {
  it("prints whole numbers with thousands separators", () => {
    expect(formatInteger(919728)).toBe("919,728");
    expect(formatInteger(0)).toBe("0");
    expect(formatInteger(1234.6)).toBe("1,235");
  });

  it("prints a share with fixed decimals", () => {
    expect(formatPercent(3.4043)).toBe("3.40%");
    expect(formatPercent(96.995, 0)).toBe("97%");
    expect(formatPercent(0)).toBe("0.00%");
  });
});
