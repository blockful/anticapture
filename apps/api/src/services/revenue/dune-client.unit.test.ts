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

    expect(result).toEqual(body);
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

    expect(result).toEqual({ result: { rows: [] } });
  });

  // A 404 means the query id is gone and a 401 that the key expired. Both are
  // our misconfiguration, so they must not hide behind an empty 200.
  it.each([401, 403, 404])(
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

    expect(result).toEqual({ result: { rows: [] } });
    expect(degraded.recorded()).toEqual([
      { upstream: "dune", resource: "revenue_actions", mode: "empty" },
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

    expect(first).toEqual({ result: { rows: [] } });
    expect(second).toEqual({ result: { rows: [{ id: 1 }] } });
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

    expect(result).toEqual([]);
    expect(degraded.recorded()).toEqual([
      { upstream: "dune", resource: "revenue_actions", mode: "empty" },
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

    expect(result).toEqual([
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

    expect(result).toEqual([
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

    expect(await client.fetchActions()).toEqual([]);
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

    expect(await client.fetchActions()).toEqual([]);
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

    expect(result).toEqual([
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

    expect(result).toEqual({ result: { rows: [] } });
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
    expect(third).toEqual({ result: { rows: [{ id: 1 }] } });
  });

  it("returns an empty result set on network error", async () => {
    server.use(http.get(urls.actions, () => HttpResponse.error()));
    const degraded = captureDegradedUpstream();

    const result = await client.fetchKey("actions");

    expect(result).toEqual({ result: { rows: [] } });
    // The empty result set is a 200 downstream, so this counter is the only
    // signal operators get that Dune is failing.
    expect(degraded.recorded()).toEqual([
      { upstream: "dune", resource: "revenue_actions", mode: "empty" },
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
    expect(result).toEqual({ result: { rows: [{ id: 1 }] } });
    expect(degraded.recorded()).toEqual([
      { upstream: "dune", resource: "revenue_actions", mode: "stale" },
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

    expect(first).toEqual({ result: { rows: [{ id: 1 }] } });
    expect(second).toEqual({ result: { rows: [{ id: 1 }] } });
    expect(hits).toBe(1);
  });

  it("re-fetches after the 24h TTL expires", async () => {
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
});
