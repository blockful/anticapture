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

class TestableRevenueDuneClient extends RevenueDuneClient {
  public fetchKey<T>(key: RevenueQueryKey) {
    return this.fetchJson<T>(key);
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
        return HttpResponse.json({ rows: [] });
      }),
    );

    await client.fetchKey("actions");

    expect(capturedHeaders?.get("X-Dune-API-Key")).toBe(API_KEY);
  });

  it("returns the parsed JSON body on success", async () => {
    const body = { rows: [{ a: 1 }] };
    server.use(http.get(urls.actions, () => HttpResponse.json(body)));

    const result = await client.fetchKey<typeof body>("actions");

    expect(result).toEqual(body);
  });

  it("throws HTTPException(503) on 5xx response", async () => {
    server.use(
      http.get(
        urls.actions,
        () =>
          new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          }),
      ),
    );

    await expect(client.fetchKey("actions")).rejects.toMatchObject({
      status: 503,
    });
  });

  it("throws HTTPException(503) on network error", async () => {
    server.use(http.get(urls.actions, () => HttpResponse.error()));

    await expect(client.fetchKey("actions")).rejects.toMatchObject({
      status: 503,
    });
  });

  it("returns cached value on the second call within TTL without re-hitting MSW", async () => {
    let hits = 0;
    server.use(
      http.get(urls.actions, () => {
        hits += 1;
        return HttpResponse.json({ rows: [{ id: hits }] });
      }),
    );

    const first = await client.fetchKey<{ rows: { id: number }[] }>("actions");
    const second = await client.fetchKey<{ rows: { id: number }[] }>("actions");

    expect(first).toEqual({ rows: [{ id: 1 }] });
    expect(second).toEqual({ rows: [{ id: 1 }] });
    expect(hits).toBe(1);
  });

  it("re-fetches after the 24h TTL expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    let hits = 0;
    server.use(
      http.get(urls.actions, () => {
        hits += 1;
        return HttpResponse.json({ rows: [{ id: hits }] });
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
        return HttpResponse.json({ rows: [{ kind: "actions" }] });
      }),
      http.get(urls.activeNames, () => {
        activeNamesHits += 1;
        return HttpResponse.json({ rows: [{ kind: "activeNames" }] });
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
