import { OpenAPIHono } from "@hono/zod-openapi";
import { http, HttpResponse, JsonBodyType } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { captureDegradedUpstream } from "@/lib/degraded-upstream.test-support";
import { DaoIdEnum } from "@/lib/enums";
import { errorHandler } from "@/middlewares";
import { CoingeckoService } from "@/services/coingecko";

import { tokenHistoricalData } from "./token-historical-data";

const API_URL = "https://api.coingecko.com";
const MARKET_CHART_URL = `${API_URL}/coins/uniswap/market_chart`;

const server = setupServer();
// Strict: a request no handler covers must fail here, never reach CoinGecko.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const marketChart = (body: JsonBodyType) =>
  http.get(MARKET_CHART_URL, () => HttpResponse.json(body));
const marketChartStatus = (status: number) =>
  http.get(MARKET_CHART_URL, () => new HttpResponse(null, { status }));

const CHART = {
  prices: [
    [1700000000000, 5.42],
    [1700086400000, 5.78],
  ],
};
const SERIES = [
  { price: "5.4200", timestamp: 1700000000 },
  { price: "5.7800", timestamp: 1700086400 },
];

// The real controller on the real price service; CoinGecko is the only thing
// stood in for, at the HTTP boundary. A fresh service per app, since it keeps
// the last good series to serve stale and that must not leak between tests.
const buildApp = () => {
  const app = new OpenAPIHono();
  app.onError(errorHandler);
  tokenHistoricalData(
    app,
    new CoingeckoService(API_URL, "test-api-key", DaoIdEnum.UNI),
  );
  return app;
};

describe("GET /token/historical-data", () => {
  it("serves CoinGecko prices under the route's max-age", async () => {
    server.use(marketChart(CHART));
    const degraded = captureDegradedUpstream();
    const app = buildApp();

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(await res.json()).toEqual(SERIES);
    expect(degraded.recorded()).toEqual([]);
  });

  it("serves the last good series with no-store once CoinGecko fails", async () => {
    server.use(marketChart(CHART));
    const app = buildApp();
    await app.request("/token/historical-data?limit=7");

    server.use(marketChartStatus(500));
    const degraded = captureDegradedUpstream();
    const res = await app.request("/token/historical-data?limit=7");

    // Stale prices are still the truth as of an hour ago, but caching them
    // for the route's regular hour would outlive the outage.
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual(SERIES);
    expect(degraded.recorded()).toEqual([
      {
        upstream: "coingecko",
        resource: "token_historical_prices",
        mode: "stale",
        reason: "unavailable",
      },
    ]);
  });

  it("degrades to an empty series when CoinGecko is down and nothing is cached", async () => {
    server.use(marketChartStatus(500));
    const degraded = captureDegradedUpstream();
    const app = buildApp();

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual([]);
    // The empty series is a 200, so this counter is the only alerting signal.
    expect(degraded.recorded()).toEqual([
      {
        upstream: "coingecko",
        resource: "token_historical_prices",
        mode: "empty",
        reason: "unavailable",
      },
    ]);
  });

  it("treats a malformed CoinGecko body as an outage", async () => {
    server.use(marketChart({ invalid: "structure" }));
    const degraded = captureDegradedUpstream();
    const app = buildApp();

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual([]);
    expect(degraded.recorded()).toEqual([
      {
        upstream: "coingecko",
        resource: "token_historical_prices",
        mode: "empty",
        reason: "unavailable",
      },
    ]);
  });

  // A token the provider stopped listing will not come back on its own, so
  // the counter has to carry `not_found` rather than fold it into an outage.
  it("labels a delisted token apart from an outage", async () => {
    server.use(marketChartStatus(404));
    const degraded = captureDegradedUpstream();
    const app = buildApp();

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual([]);
    expect(degraded.recorded()).toEqual([
      {
        upstream: "coingecko",
        resource: "token_historical_prices",
        mode: "empty",
        reason: "not_found",
      },
    ]);
  });

  // A rejected key is our misconfiguration, fixed by us and not by waiting,
  // so it stays a loud 502 rather than an empty 200.
  it("keeps a rejected API key as a 502 and counts nothing", async () => {
    server.use(marketChartStatus(401));
    const degraded = captureDegradedUpstream();
    const app = buildApp();

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(502);
    expect(degraded.recorded()).toEqual([]);
  });
});
