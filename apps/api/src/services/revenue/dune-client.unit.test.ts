import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { z } from "zod";

import { captureDegradedUpstream } from "@/lib/degraded-upstream.test-support";
import { revenueDataAges } from "@/metrics";

import { RevenueCache } from "./cache";
import {
  REVENUE_QUERY_KEYS,
  RevenueDuneClient,
  RevenueDuneUrls,
  RevenueQueryKey,
} from "./dune-client";

const API_KEY = "test-revenue-dune-api-key";

function buildUrls(
  base = "https://api.dune.com/api/v1/query",
): RevenueDuneUrls {
  return REVENUE_QUERY_KEYS.reduce<RevenueDuneUrls>(
    (acc, key, idx) => ({ ...acc, [key]: `${base}/${idx}/results` }),
    {} as RevenueDuneUrls,
  );
}

/**
 * Permissive row schema for the transport and caching tests, which are not
 * about column validation. The column schemas are exercised through the public
 * `fetchActions` below.
 */
const AnyRowSchema = z.record(z.string(), z.unknown());

/** The empty fallback: nothing served, no time to report. */
const EMPTY = { rows: [], meta: { asOf: null, degraded: true } };
/** Rows straight from a successful Dune read. */
const fresh = (rows: unknown[], asOf: string | null = null) => ({
  rows,
  meta: { asOf, degraded: false },
});
/** A copy of earlier rows served after a Dune failure. */
const stale = (rows: unknown[], asOf: string | null = null) => ({
  rows,
  meta: { asOf, degraded: true },
});

class TestableRevenueDuneClient extends RevenueDuneClient {
  public fetchKey(key: RevenueQueryKey, rowSchema: z.ZodType = AnyRowSchema) {
    return this.fetchJson(key, rowSchema);
  }
}

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

describe("RevenueDuneClient", () => {
  let urls: RevenueDuneUrls;
  let client: TestableRevenueDuneClient;

  beforeEach(() => {
    urls = buildUrls();
    client = new TestableRevenueDuneClient(API_KEY, urls);
  });

  it("sends the X-Dune-API-Key header", async () => {
    let capturedHeaders: Headers | undefined;
    server.use(
      http.get(urls.actions, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ result: { rows: [] } });
      }),
    );

    await client.fetchKey("actions");

    expect(capturedHeaders?.get("X-Dune-API-Key")).toBe(API_KEY);
  });

  it("returns the parsed JSON body on success", async () => {
    const body = { result: { rows: [{ a: 1 }] } };
    server.use(http.get(urls.actions, () => HttpResponse.json(body)));

    const result = await client.fetchKey("actions");

    expect(result).toEqual(fresh(body.result.rows));
  });

  it("returns an empty result set when Dune is unhealthy", async () => {
    server.use(
      http.get(
        urls.actions,
        () =>
          new HttpResponse(null, {
            status: 503,
            statusText: "Service Unavailable",
          }),
      ),
    );

    const result = await client.fetchKey("actions");

    expect(result).toEqual(EMPTY);
  });

  // A 401 or 403 means the key is wrong, which waiting will not fix.
  it.each([401, 403])(
    "throws HTTPException(502) when Dune rejects with %i",
    async (status) => {
      server.use(
        http.get(urls.actions, () => new HttpResponse(null, { status })),
      );
      const degraded = captureDegradedUpstream();

      await expect(client.fetchKey("actions")).rejects.toMatchObject({
        status: 502,
      });
      expect(degraded.recorded()).toEqual([]);
    },
  );

  // Nothing stale to serve: the empty answer is leased so an outage is not
  // re-probed at the full provider deadline by every request.
  it("leases the empty fallback instead of re-probing Dune on every request", async () => {
    let calls = 0;
    server.use(
      http.get(urls.actions, () => {
        calls += 1;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    expect(await client.fetchKey("actions")).toEqual(EMPTY);
    expect(await client.fetchKey("actions")).toEqual(EMPTY);
    expect(calls).toBe(1);
  });

  // A results 404 means the query has no completed execution for its latest
  // version, or its result expired: it needs a re-run on Dune. A 502 there
  // would leave the route 5xx-ing, so it degrades, but under a reason that
  // says it will not clear on its own.
  it("degrades a 404 on a results endpoint under the not_found reason", async () => {
    server.use(
      http.get(urls.actions, () => new HttpResponse(null, { status: 404 })),
    );
    const degraded = captureDegradedUpstream();

    const result = await client.fetchKey("actions");

    expect(result).toEqual(EMPTY);
    expect(degraded.recorded()).toEqual([
      {
        upstream: "dune",
        resource: "revenue_actions",
        mode: "empty",
        reason: "not_found",
      },
    ]);
  });

  // Only Dune's own failures may become an empty 200. Ours have to stay a real
  // error so the HTTP error metrics still count them.
  it("propagates a failure that is not Dune's instead of degrading", async () => {
    const ourBug = new Error("cache write failed");
    vi.spyOn(RevenueCache.prototype, "set").mockImplementation(() => {
      throw ourBug;
    });
    server.use(
      http.get(urls.actions, () =>
        HttpResponse.json({ result: { rows: [{ a: 1 }] } }),
      ),
    );
    const degraded = captureDegradedUpstream();

    await expect(client.fetchKey("actions")).rejects.toBe(ourBug);
    expect(degraded.recorded()).toEqual([]);
  });

  // A malformed 2xx body used to sail past the classification and get cached
  // for 24h, so every later call failed from the cache.
  it.each([
    ["a missing result envelope", { rows: [{ a: 1 }] }],
    ["rows that are not an array", { result: { rows: "nope" } }],
    ["a missing rows key", { result: {} }],
  ])("degrades on %s instead of caching it", async (_label, body) => {
    server.use(http.get(urls.actions, () => HttpResponse.json(body)));
    const degraded = captureDegradedUpstream();

    const result = await client.fetchKey("actions");

    expect(result).toEqual(EMPTY);
    expect(degraded.recorded()).toEqual([
      {
        upstream: "dune",
        resource: "revenue_actions",
        mode: "empty",
        reason: "unavailable",
      },
    ]);
  });

  it("does not cache a malformed body, so a later good response wins", async () => {
    let hits = 0;
    server.use(
      http.get(urls.actions, () => {
        hits += 1;
        return hits === 1
          ? HttpResponse.json({ result: "not an envelope" })
          : HttpResponse.json({ result: { rows: [{ id: 1 }] } });
      }),
    );

    const first = await client.fetchKey("actions");
    const second = await client.fetchKey("actions");

    expect(first).toEqual(EMPTY);
    expect(second).toEqual(fresh([{ id: 1 }]));
  });

  // A renamed or nulled column used to be cached for 24h and then blow up in
  // the mapper on every later request, outside the classified path.
  it("degrades on a row whose columns do not match the query schema", async () => {
    server.use(
      http.get(urls.actions, () =>
        HttpResponse.json({
          result: { rows: [{ renamed_month: "x", category: "Renewal" }] },
        }),
      ),
    );
    const degraded = captureDegradedUpstream();

    const result = await client.fetchActions();

    expect(result).toEqual({ items: [], meta: EMPTY.meta });
    expect(degraded.recorded()).toEqual([
      {
        upstream: "dune",
        resource: "revenue_actions",
        mode: "empty",
        reason: "unavailable",
      },
    ]);
  });

  it("maps null aggregates to zero instead of rejecting the row", async () => {
    server.use(
      http.get(urls.actions, () =>
        HttpResponse.json({
          result: {
            rows: [
              {
                month: "2026-01-01 00:00:00 UTC",
                category: "Renewal",
                actions: null,
              },
            ],
          },
        }),
      ),
    );

    const result = await client.fetchActions();

    expect(result.items).toEqual([
      { date: 1767225600, category: "Renewal", actions: 0 },
    ]);
  });

  it("accepts numeric columns Dune serialised as text", async () => {
    server.use(
      http.get(urls.actions, () =>
        HttpResponse.json({
          result: {
            rows: [
              {
                month: "2026-01-01 00:00:00 UTC",
                category: "Renewal",
                actions: "1234",
              },
            ],
          },
        }),
      ),
    );

    const result = await client.fetchActions();

    expect(result.items).toEqual([
      { date: 1767225600, category: "Renewal", actions: 1234 },
    ]);
  });

  it("degrades on a numeric column that is not a number", async () => {
    server.use(
      http.get(urls.actions, () =>
        HttpResponse.json({
          result: {
            rows: [
              {
                month: "2026-01-01 00:00:00 UTC",
                category: "Renewal",
                actions: "not a number",
              },
            ],
          },
        }),
      ),
    );

    expect((await client.fetchActions()).items).toEqual([]);
  });

  // Previously a format change passed validation, was cached for 24h, and then
  // threw in parseDuneMonth on every later request.
  it("degrades on a month that parseDuneMonth cannot read", async () => {
    server.use(
      http.get(urls.actions, () =>
        HttpResponse.json({
          result: {
            rows: [{ month: "2026-01-01", category: "Renewal", actions: 1 }],
          },
        }),
      ),
    );

    expect((await client.fetchActions()).items).toEqual([]);
  });

  it("drops a row with an unknown label instead of the whole series", async () => {
    server.use(
      http.get(urls.actions, () =>
        HttpResponse.json({
          result: {
            rows: [
              {
                month: "2026-01-01 00:00:00 UTC",
                category: "Renewal",
                actions: 1,
              },
              {
                month: "2026-02-01 00:00:00 UTC",
                category: "BrandNewCategory",
                actions: 2,
              },
            ],
          },
        }),
      ),
    );

    const result = await client.fetchActions();

    expect(result.items).toEqual([
      { date: 1767225600, category: "Renewal", actions: 1 },
    ]);
  });

  it("stops serving stale revenue once it is older than the cap", async () => {
    let hits = 0;
    server.use(
      http.get(urls.actions, () => {
        hits += 1;
        return hits === 1
          ? HttpResponse.json({ result: { rows: [{ id: 1 }] } })
          : new HttpResponse(null, { status: 503 });
      }),
    );

    await client.fetchKey("actions");
    vi.useFakeTimers();
    // Past the fresh TTL plus the extra stale day.
    vi.setSystemTime(Date.now() + 48 * 60 * 60 * 1000 + 1);
    const result = await client.fetchKey("actions");

    expect(result).toEqual(EMPTY);
  });

  it("shares one upstream call between concurrent requests for a key", async () => {
    let hits = 0;
    server.use(
      http.get(urls.actions, async () => {
        hits += 1;
        return HttpResponse.json({ result: { rows: [{ id: hits }] } });
      }),
    );

    const [first, second] = await Promise.all([
      client.fetchKey("actions"),
      client.fetchKey("actions"),
    ]);

    expect(hits).toBe(1);
    expect(second).toEqual(first);
  });

  it("leases stale data briefly so an outage is not re-probed per request", async () => {
    let hits = 0;
    server.use(
      http.get(urls.actions, () => {
        hits += 1;
        return hits === 1
          ? HttpResponse.json({ result: { rows: [{ id: 1 }] } })
          : new HttpResponse(null, { status: 503 });
      }),
    );

    await client.fetchKey("actions");
    // Expire the 24h entry so the next call goes upstream and fails.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000 + 1);
    await client.fetchKey("actions");
    const third = await client.fetchKey("actions");

    // Two upstream calls, not three: the third was served from the 60s lease.
    expect(hits).toBe(2);
    expect(third).toEqual(stale([{ id: 1 }]));
  });

  it("returns an empty result set on network error", async () => {
    server.use(http.get(urls.actions, () => HttpResponse.error()));
    const degraded = captureDegradedUpstream();

    const result = await client.fetchKey("actions");

    expect(result).toEqual(EMPTY);
    // The empty result set is a 200 downstream, so this counter is the only
    // signal operators get that Dune is failing.
    expect(degraded.recorded()).toEqual([
      {
        upstream: "dune",
        resource: "revenue_actions",
        mode: "empty",
        reason: "unavailable",
      },
    ]);
  });

  it("serves the last successful result when Dune fails after the TTL", async () => {
    const degraded = captureDegradedUpstream();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    let hits = 0;
    server.use(
      http.get(urls.actions, () => {
        hits += 1;
        return hits === 1
          ? HttpResponse.json({ result: { rows: [{ id: 1 }] } })
          : new HttpResponse(null, { status: 500 });
      }),
    );

    await client.fetchKey("actions");
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    const result = await client.fetchKey("actions");

    expect(hits).toBe(2);
    expect(result).toEqual(stale([{ id: 1 }]));
    expect(degraded.recorded()).toEqual([
      {
        upstream: "dune",
        resource: "revenue_actions",
        mode: "stale",
        reason: "unavailable",
      },
    ]);
  });

  it("returns cached value on the second call within TTL without re-hitting MSW", async () => {
    let hits = 0;
    server.use(
      http.get(urls.actions, () => {
        hits += 1;
        return HttpResponse.json({ result: { rows: [{ id: hits }] } });
      }),
    );

    const first = await client.fetchKey("actions");
    const second = await client.fetchKey("actions");

    expect(first).toEqual(fresh([{ id: 1 }]));
    expect(second).toEqual(fresh([{ id: 1 }]));
    expect(hits).toBe(1);
  });

  it("re-fetches after the cache TTL expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    let hits = 0;
    server.use(
      http.get(urls.actions, () => {
        hits += 1;
        return HttpResponse.json({ result: { rows: [{ id: hits }] } });
      }),
    );

    await client.fetchKey("actions");
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    await client.fetchKey("actions");

    expect(hits).toBe(2);
  });

  it("scopes the cache per query key", async () => {
    let actionsHits = 0;
    let activeNamesHits = 0;
    server.use(
      http.get(urls.actions, () => {
        actionsHits += 1;
        return HttpResponse.json({ result: { rows: [{ kind: "actions" }] } });
      }),
      http.get(urls.activeNames, () => {
        activeNamesHits += 1;
        return HttpResponse.json({
          result: { rows: [{ kind: "activeNames" }] },
        });
      }),
    );

    await client.fetchKey("actions");
    await client.fetchKey("activeNames");
    await client.fetchKey("actions");
    await client.fetchKey("activeNames");

    expect(actionsHits).toBe(1);
    expect(activeNamesHits).toBe(1);
  });

  describe("meta", () => {
    const ENDED_AT = "2026-09-23T00:08:52.123456789Z";
    const AS_OF = "2026-09-23T00:08:52.123Z";
    const okBody = (rows: unknown[], endedAt: unknown = ENDED_AT) => ({
      execution_id: "01K5TESTEXECUTION",
      execution_ended_at: endedAt,
      expires_at: "2026-12-22T00:08:52.123456789Z",
      result: { rows },
    });

    it("keeps Dune's execution_ended_at as asOf on a healthy read", async () => {
      server.use(
        http.get(urls.actions, () => HttpResponse.json(okBody([{ id: 1 }]))),
      );

      expect(await client.fetchKey("actions")).toEqual(
        fresh([{ id: 1 }], AS_OF),
      );
    });

    it("carries asOf through the public fetchers", async () => {
      server.use(
        http.get(urls.actions, () =>
          HttpResponse.json(
            okBody([
              {
                month: "2026-01-01 00:00:00 UTC",
                category: "Renewal",
                actions: 1,
              },
            ]),
          ),
        ),
      );

      expect(await client.fetchActions()).toEqual({
        items: [{ date: 1767225600, category: "Renewal", actions: 1 }],
        meta: { asOf: AS_OF, degraded: false },
      });
    });

    it.each([
      ["missing", undefined],
      ["null", null],
      ["not a timestamp", "yesterday"],
      ["not a string", 1758586132],
    ])(
      "keeps the rows with an unknown asOf when execution_ended_at is %s",
      async (_label, endedAt) => {
        const body =
          endedAt === undefined
            ? { result: { rows: [{ id: 1 }] } }
            : okBody([{ id: 1 }], endedAt);
        server.use(http.get(urls.actions, () => HttpResponse.json(body)));
        const degraded = captureDegradedUpstream();

        expect(await client.fetchKey("actions")).toEqual(
          fresh([{ id: 1 }], null),
        );
        expect(degraded.recorded()).toEqual([]);
      },
    );

    it("serves a stale copy with its original asOf, marked degraded, for the whole lease", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
      let hits = 0;
      server.use(
        http.get(urls.actions, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json(okBody([{ id: 1 }]))
            : new HttpResponse(null, { status: 503 });
        }),
      );

      await client.fetchKey("actions");
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
      const failed = await client.fetchKey("actions");
      // Answered from the 60s lease, not from Dune: still degraded.
      const leased = await client.fetchKey("actions");

      expect(hits).toBe(2);
      expect(failed).toEqual(stale([{ id: 1 }], AS_OF));
      expect(leased).toEqual(stale([{ id: 1 }], AS_OF));
    });

    it("marks a fresh read after recovery healthy again", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
      let hits = 0;
      server.use(
        http.get(urls.actions, () => {
          hits += 1;
          if (hits === 2) return new HttpResponse(null, { status: 503 });
          return HttpResponse.json(
            okBody(
              [{ id: hits }],
              hits === 1 ? ENDED_AT : "2026-10-02T00:00:00Z",
            ),
          );
        }),
      );

      await client.fetchKey("actions");
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
      await client.fetchKey("actions");
      // Past the 60s stale lease: Dune is asked again and answers.
      vi.advanceTimersByTime(60 * 1000 + 1);
      const recovered = await client.fetchKey("actions");

      expect(recovered).toEqual(fresh([{ id: 3 }], "2026-10-02T00:00:00.000Z"));
    });

    it("hands joiners of an in-flight fetch the same meta", async () => {
      server.use(
        http.get(urls.actions, () => HttpResponse.json(okBody([{ id: 1 }]))),
      );

      const [first, second] = await Promise.all([
        client.fetchKey("actions"),
        client.fetchKey("actions"),
      ]);

      expect(first).toEqual(fresh([{ id: 1 }], AS_OF));
      expect(second).toEqual(first);
    });

    it("reports the served rows' age on the revenue_data_age_seconds gauge", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
      let hits = 0;
      server.use(
        http.get(urls.actions, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json(okBody([{ id: 1 }]))
            : new HttpResponse(null, { status: 503 });
        }),
      );

      await client.fetchKey("actions");
      const ageAt = (now: number) =>
        revenueDataAges(now).find(({ query }) => query === "actions")
          ?.ageSeconds;
      const asOfMs = Date.parse(AS_OF);

      expect(ageAt(asOfMs + 1000)).toBe(1);
      // A stale copy served after a failure does not reset the age.
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
      await client.fetchKey("actions");
      expect(ageAt(asOfMs + 90_000_000)).toBe(90_000);
    });

    it("reports no age once the query has not been served for an hour", async () => {
      server.use(
        http.get(urls.actions, () => HttpResponse.json(okBody([{ id: 1 }]))),
      );

      await client.fetchKey("actions");
      const has = (now: number) =>
        revenueDataAges(now).some(({ query }) => query === "actions");

      expect(has(Date.now() + 59 * 60 * 1000)).toBe(true);
      // An idle replica would otherwise age past the alert threshold while
      // Dune is healthy.
      expect(has(Date.now() + 61 * 60 * 1000)).toBe(false);
    });

    it("drops the age series when a healthy read has no execution_ended_at", async () => {
      let hits = 0;
      server.use(
        http.get(urls.actions, () => {
          hits += 1;
          return HttpResponse.json(
            okBody([{ id: 1 }], hits === 1 ? ENDED_AT : null),
          );
        }),
      );

      await client.fetchKey("actions");
      // A second process-wide client, so the read is not served from cache.
      await new TestableRevenueDuneClient(API_KEY, urls).fetchKey("actions");

      expect(revenueDataAges().some(({ query }) => query === "actions")).toBe(
        false,
      );
    });
  });

  // Dune answers 402 when the account is over its billing limits. That will
  // not clear by waiting, but a 502 would trip the DAO's gateway breaker, so
  // the revenue client degrades it under its own reason.
  describe("HTTP 402", () => {
    it("serves the empty fallback, leased, under the payment_required reason", async () => {
      let calls = 0;
      server.use(
        http.get(urls.actions, () => {
          calls += 1;
          return new HttpResponse(null, {
            status: 402,
            statusText: "Payment Required",
          });
        }),
      );
      const degraded = captureDegradedUpstream();

      expect(await client.fetchKey("actions")).toEqual(EMPTY);
      expect(await client.fetchKey("actions")).toEqual(EMPTY);
      expect(calls).toBe(1);
      expect(degraded.recorded()).toEqual([
        {
          upstream: "dune",
          resource: "revenue_actions",
          mode: "empty",
          reason: "payment_required",
        },
      ]);
    });

    it("serves the last good rows stale before falling back to empty", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
      let hits = 0;
      server.use(
        http.get(urls.actions, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json({
                execution_ended_at: "2026-09-23T00:08:52Z",
                result: { rows: [{ id: 1 }] },
              })
            : new HttpResponse(null, { status: 402 });
        }),
      );
      const degraded = captureDegradedUpstream();

      await client.fetchKey("actions");
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
      const staleCopy = await client.fetchKey("actions");
      // Past the 48h stale cap nothing old enough is left to serve.
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      const empty = await client.fetchKey("actions");

      expect(staleCopy).toEqual(stale([{ id: 1 }], "2026-09-23T00:08:52.000Z"));
      expect(empty).toEqual(EMPTY);
      expect(degraded.recorded()).toEqual([
        {
          upstream: "dune",
          resource: "revenue_actions",
          mode: "stale",
          reason: "payment_required",
        },
        {
          upstream: "dune",
          resource: "revenue_actions",
          mode: "empty",
          reason: "payment_required",
        },
      ]);
    });
  });
});
