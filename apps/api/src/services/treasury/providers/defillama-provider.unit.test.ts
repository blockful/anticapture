import axios from "axios";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from "vitest";
import { DefiLlamaProvider } from "./defillama-provider";

const BASE_URL = "http://defillama.test.com";
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
// A failing assertion inside a fake-timer test must not leak the clock
// into every test that follows.
afterEach(() => vi.useRealTimers());
afterAll(() => server.close());

describe("DefiLlamaProvider", () => {
  let provider: DefiLlamaProvider;

  beforeEach(() => {
    provider = new DefiLlamaProvider(axios.create({ baseURL: BASE_URL }));
  });

  it("should fetch and transform single chain data", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 5000 }],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 5000 }]);
  });

  it("should skip chain keys containing '-'", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 5000 }],
            },
            "Ethereum-OwnTokens": {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 1000 }],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(0);

    // Only Ethereum counted, Ethereum-OwnTokens skipped
    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 5000 }]);
  });

  it("should handle OwnTokens (excluded from liquidTreasury)", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 5000 }],
            },
            OwnTokens: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 2000 }],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(0);

    // OwnTokens adds to total only, not to withoutOwnToken
    // liquidTreasury = withoutOwnToken = 5000
    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 5000 }]);
  });

  it("should aggregate multiple chains", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 3000 }],
            },
            Polygon: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 2000 }],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 5000 }]);
  });

  it("should apply cutoff via filterWithFallback", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [
                { date: 1600000000, totalLiquidityUSD: 1000 },
                { date: 1700006400, totalLiquidityUSD: 2000 },
              ],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(1700000000);

    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 2000 }]);
  });

  it("should cache after first fetch", async () => {
    let callCount = 0;
    server.use(
      http.get(BASE_URL, () => {
        callCount++;
        return HttpResponse.json({ chainTvls: {} });
      }),
    );

    await provider.fetchTreasury(0);
    await provider.fetchTreasury(0);

    expect(callCount).toBe(1);
  });

  it("offers the last good series as stale within the max age", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            ethereum: {
              tvl: [{ date: 1700000000, totalLiquidityUSD: 100 }],
            },
          },
        }),
      ),
    );

    await provider.fetchTreasury(0);
    // Past the 24h fresh TTL but inside the extra stale day.
    vi.setSystemTime(Date.now() + 36 * 60 * 60 * 1000);

    expect(provider.getStaleTreasury()).toEqual([
      { date: 1699920000, liquidTreasury: 100 },
    ]);

    // Past the cap, nothing is offered.
    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000);
    expect(provider.getStaleTreasury()).toBeNull();
    vi.useRealTimers();
  });

  it("caches nothing when the fetch fails", async () => {
    server.use(http.get(BASE_URL, () => HttpResponse.error()));

    await expect(provider.fetchTreasury(0)).rejects.toThrow();

    expect(provider.getStaleTreasury()).toBeNull();
  });

  // This used to swallow every failure and return an empty array, so a
  // DefiLlama outage was invisible. The caller degrades and counts it now.
  it("throws a classified upstream error on a transport failure", async () => {
    server.use(http.get(BASE_URL, () => HttpResponse.error()));

    await expect(provider.fetchTreasury(0)).rejects.toMatchObject({
      upstream: "defillama",
    });
  });

  // A renamed protocol slug 404s persistently. A 502 would trip the DAO's
  // gateway breaker over one chart, so it degrades under not_found instead.
  it("degrades a 404 under the not_found reason", async () => {
    server.use(
      http.get(BASE_URL, () => new HttpResponse(null, { status: 404 })),
    );

    await expect(provider.fetchTreasury(0)).rejects.toMatchObject({
      upstream: "defillama",
      reason: "not_found",
    });
  });

  it("throws HTTPException(502) when DefiLlama rejects the request", async () => {
    server.use(
      http.get(BASE_URL, () => new HttpResponse(null, { status: 403 })),
    );

    await expect(provider.fetchTreasury(0)).rejects.toMatchObject({
      status: 502,
    });
  });
});
