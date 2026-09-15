import { describe, expect, it } from "vitest";

import { filterByRange, parseDuneMonth, isValidDuneMonth } from "./utils";

describe("parseDuneMonth", () => {
  it("parses 'YYYY-MM-DD HH:mm:ss.SSS UTC' to seconds at start-of-month UTC", () => {
    expect(parseDuneMonth("2024-01-01 00:00:00.000 UTC")).toBe(
      Date.UTC(2024, 0, 1) / 1000,
    );
    expect(parseDuneMonth("2023-04-01 00:00:00.000 UTC")).toBe(
      Date.UTC(2023, 3, 1) / 1000,
    );
  });

  it("parses without fractional seconds", () => {
    expect(parseDuneMonth("2024-06-01 00:00:00 UTC")).toBe(
      Date.UTC(2024, 5, 1) / 1000,
    );
  });

  it("throws on invalid format", () => {
    expect(() => parseDuneMonth("not-a-date")).toThrow(/Invalid Dune month/);
  });
});

describe("filterByRange", () => {
  const items = [
    { date: 100, v: "a" },
    { date: 200, v: "b" },
    { date: 300, v: "c" },
  ];

  it("returns all items when both bounds are undefined", () => {
    expect(filterByRange(items, undefined, undefined)).toEqual(items);
  });

  it("filters out items before fromDate (inclusive)", () => {
    expect(filterByRange(items, 200, undefined)).toEqual([
      { date: 200, v: "b" },
      { date: 300, v: "c" },
    ]);
  });

  it("filters out items after toDate (inclusive)", () => {
    expect(filterByRange(items, undefined, 200)).toEqual([
      { date: 100, v: "a" },
      { date: 200, v: "b" },
    ]);
  });

  it("filters by both bounds inclusively", () => {
    expect(filterByRange(items, 200, 200)).toEqual([{ date: 200, v: "b" }]);
  });
});

describe("isValidDuneMonth", () => {
  it("accepts a real calendar timestamp", () => {
    expect(isValidDuneMonth("2026-02-28 00:00:00 UTC")).toBe(true);
    expect(isValidDuneMonth("2024-02-29 00:00:00.000 UTC")).toBe(true);
  });

  it("rejects dates the digit widths allow but the calendar does not", () => {
    // Date.UTC would roll each of these into another month or year.
    expect(isValidDuneMonth("2026-13-01 00:00:00 UTC")).toBe(false);
    expect(isValidDuneMonth("2026-02-31 00:00:00 UTC")).toBe(false);
    expect(isValidDuneMonth("2025-02-29 00:00:00 UTC")).toBe(false);
    expect(isValidDuneMonth("2026-01-01 24:00:00 UTC")).toBe(false);
  });

  it("rejects what the regex already rejects", () => {
    expect(isValidDuneMonth("2026-01-01")).toBe(false);
  });
});
