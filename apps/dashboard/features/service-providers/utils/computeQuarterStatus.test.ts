import {
  computeQuarterStatus,
  getDueDate,
  getDueDateLabel,
} from "@/features/service-providers/utils/computeQuarterStatus";

describe("getDueDate", () => {
  test("defaults to the last second of the quarter", () => {
    expect(getDueDate(2026, "Q3").toISOString()).toBe(
      "2026-09-30T23:59:59.000Z",
    );
  });

  test("adds the program's report window after the quarter ends", () => {
    expect(getDueDate(2026, "Q3", 30).toISOString()).toBe(
      "2026-10-30T23:59:59.000Z",
    );
  });

  test("rolls a Q4 report window into the next year", () => {
    expect(getDueDate(2026, "Q4", 30).toISOString()).toBe(
      "2027-01-30T23:59:59.000Z",
    );
  });
});

describe("getDueDateLabel", () => {
  test("labels the quarter end when there is no report window", () => {
    expect(getDueDateLabel(2026, "Q3")).toBe("Due by Sep 30");
  });

  test("labels the actual deadline when there is a report window", () => {
    expect(getDueDateLabel(2026, "Q3", 30)).toBe("Due by Oct 30");
    expect(getDueDateLabel(2026, "Q4", 30)).toBe("Due by Jan 30");
  });
});

describe("computeQuarterStatus", () => {
  const oct5 = new Date("2026-10-05T12:00:00Z");

  test("is overdue the day after the quarter ends without a report window", () => {
    expect(computeQuarterStatus(2026, "Q3", oct5)).toBe("overdue");
  });

  test("is still due soon inside the program's report window", () => {
    expect(computeQuarterStatus(2026, "Q3", oct5, 30)).toBe("due_soon");
  });

  test("is overdue once the report window has passed", () => {
    expect(
      computeQuarterStatus(2026, "Q3", new Date("2026-10-31T00:00:00Z"), 30),
    ).toBe("overdue");
  });

  test("is upcoming more than 30 days before the deadline", () => {
    expect(
      computeQuarterStatus(2026, "Q3", new Date("2026-09-28T00:00:00Z"), 30),
    ).toBe("upcoming");
  });
});
