import {
  inferCutoffFromRows,
  isDataDelayed,
  readRevenueMeta,
  resolveDataCutoff,
  summarizeFreshness,
  toRenewalCohortCutoff,
  toRevenueDataState,
} from "@/features/revenue/utils/meta";

const AS_OF = "2026-09-23T00:09:06Z";
const row = { date: Date.UTC(2026, 8, 1) / 1000, totalUsd: 1 };

describe("readRevenueMeta", () => {
  it("reads asOf and degraded from the response", () => {
    expect(
      readRevenueMeta({ items: [], meta: { asOf: AS_OF, degraded: true } }),
    ).toEqual({ asOf: new Date(AS_OF), degraded: true, reported: true });
  });

  it("treats a response without meta as an older API", () => {
    expect(readRevenueMeta({ items: [], totalCount: 0 })).toEqual({
      asOf: null,
      degraded: false,
      reported: false,
    });
    expect(readRevenueMeta(undefined).reported).toBe(false);
  });

  it("ignores malformed values", () => {
    expect(
      readRevenueMeta({ meta: { asOf: "not a date", degraded: "yes" } }),
    ).toEqual({ asOf: null, degraded: false, reported: true });
    expect(readRevenueMeta({ meta: { asOf: null } }).asOf).toBeNull();
  });
});

describe("data cutoff", () => {
  const now = new Date("2026-11-04T10:00:00Z");
  const monthRow = (year: number, month: number) => ({
    date: Date.UTC(year, month, 1) / 1000,
  });

  it("uses asOf, else the rows, else the viewer's clock", () => {
    const rows = [monthRow(2026, 7), monthRow(2026, 8)];
    expect(
      resolveDataCutoff(readRevenueMeta({ meta: { asOf: AS_OF } }), now, rows),
    ).toEqual(new Date(AS_OF));
    expect(
      resolveDataCutoff(readRevenueMeta({ items: rows }), now, rows),
    ).toEqual(new Date("2026-09-30T23:59:59.999Z"));
    expect(resolveDataCutoff(readRevenueMeta({ items: [] }), now, [])).toBe(
      now,
    );
    expect(resolveDataCutoff(readRevenueMeta({ items: rows }), now)).toBe(now);
  });

  it("treats the latest row's month as partial, never past now", () => {
    // Frozen data: September is the latest month, so it is not a full month.
    expect(inferCutoffFromRows([monthRow(2026, 8)], now)?.toISOString()).toBe(
      "2026-09-30T23:59:59.999Z",
    );
    // Fresh data: the latest row is the current month.
    expect(inferCutoffFromRows([monthRow(2026, 10)], now)).toEqual(now);
    // Rows dated after now (e.g. expiry months) and undated rows are ignored.
    expect(
      inferCutoffFromRows([monthRow(2027, 0), { names: 1 }], now),
    ).toBeNull();
  });

  it("moves the renewal cohort cutoff 90 days back", () => {
    expect(toRenewalCohortCutoff(new Date(AS_OF)).toISOString()).toBe(
      "2026-06-25T00:09:06.000Z",
    );
  });
});

describe("toRevenueDataState", () => {
  const now = new Date("2026-09-23T12:00:00Z");

  it("is available with rows and a healthy meta", () => {
    const state = toRevenueDataState(
      {
        data: { items: [row], meta: { asOf: AS_OF, degraded: false } },
        isLoading: false,
        isError: false,
      },
      now,
    );
    expect(state).toMatchObject({
      isLoading: false,
      isUnavailable: false,
      cutoffKnown: true,
    });
    expect(state.cutoff).toEqual(new Date(AS_OF));
  });

  it("is unavailable when the API flags the response as degraded", () => {
    const state = toRevenueDataState(
      {
        data: { items: [row], meta: { asOf: AS_OF, degraded: true } },
        isLoading: false,
        isError: false,
      },
      now,
    );
    expect(state.isUnavailable).toBe(true);
  });

  it("is unavailable for an empty 200 (e.g. renewal tenure today)", () => {
    const state = toRevenueDataState(
      { data: { items: [], totalCount: 0 }, isLoading: false, isError: false },
      now,
    );
    expect(state.isUnavailable).toBe(true);
    expect(state.cutoff).toBe(now);
    expect(state.cutoffKnown).toBe(false);
  });

  it("infers the cutoff from the rows without meta, unless told to use the clock", () => {
    const query = {
      data: { items: [row], totalCount: 1 },
      isLoading: false,
      isError: false,
    };
    const later = new Date("2026-11-04T12:00:00Z");
    expect(toRevenueDataState(query, later)).toMatchObject({
      cutoff: new Date("2026-09-30T23:59:59.999Z"),
      cutoffKnown: false,
    });
    expect(toRevenueDataState(query, later, "clock").cutoff).toBe(later);
  });

  it("is unavailable when the request failed", () => {
    expect(
      toRevenueDataState({ isLoading: false, isError: true }, now)
        .isUnavailable,
    ).toBe(true);
  });

  it("keeps previously loaded rows when a refetch fails", () => {
    expect(
      toRevenueDataState(
        { data: { items: [row] }, isLoading: false, isError: true },
        now,
      ).isUnavailable,
    ).toBe(false);
  });

  it("is loading, not unavailable, before the first response", () => {
    expect(
      toRevenueDataState({ isLoading: true, isError: false }, now),
    ).toMatchObject({ isLoading: true, isUnavailable: false, items: [] });
  });
});

describe("freshness", () => {
  it("flags data older than 36 hours", () => {
    const asOf = new Date(AS_OF);
    expect(isDataDelayed(asOf, new Date("2026-09-24T12:09:06Z"))).toBe(false);
    expect(isDataDelayed(asOf, new Date("2026-09-24T12:09:07Z"))).toBe(true);
  });

  it("reports the oldest asOf across responses", () => {
    const freshness = summarizeFreshness(
      [
        readRevenueMeta({ meta: { asOf: "2026-11-04T08:00:00Z" } }),
        readRevenueMeta({ meta: { asOf: "2026-11-03T08:00:00Z" } }),
        readRevenueMeta({ meta: { asOf: null, degraded: true } }),
      ],
      new Date("2026-11-04T12:00:00Z"),
    );
    expect(freshness).toEqual({
      reported: true,
      asOf: new Date("2026-11-03T08:00:00Z"),
      delayed: false,
    });
  });

  it("marks today's frozen data as delayed", () => {
    const freshness = summarizeFreshness(
      [readRevenueMeta({ meta: { asOf: AS_OF, degraded: false } })],
      new Date("2026-11-04T12:00:00Z"),
    );
    expect(freshness.delayed).toBe(true);
  });

  it("stays hidden until the API reports meta", () => {
    expect(summarizeFreshness([readRevenueMeta({ items: [] })]).reported).toBe(
      false,
    );
  });
});
