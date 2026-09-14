import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it } from "vitest";

import { captureDegradedUpstream } from "@/lib/degraded-upstream.test-support";
import { UpstreamUnavailableError } from "@/lib/upstream-error";
import { errorHandler } from "@/middlewares";

import {
  TokenHistoricalDataClient,
  tokenHistoricalData,
} from "./token-historical-data";

function buildApp(client: TokenHistoricalDataClient) {
  const app = new OpenAPIHono();
  app.onError(errorHandler);
  tokenHistoricalData(app, client);
  return app;
}

describe("GET /token/historical-data cache headers", () => {
  it("keeps the route max-age on successful responses", async () => {
    const app = buildApp({ getHistoricalTokenData: async () => [] });

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
  });
});

describe("GET /token/historical-data", () => {
  it("returns the client data", async () => {
    const app = buildApp({
      getHistoricalTokenData: async () => [
        { price: "1.0000", timestamp: 1700000000 },
      ],
    });

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { price: "1.0000", timestamp: 1700000000 },
    ]);
  });

  it("degrades to an empty series when the price provider fails", async () => {
    const app = buildApp({
      getHistoricalTokenData: async () => {
        throw new UpstreamUnavailableError("coingecko", "CoinGecko down");
      },
    });
    const degraded = captureDegradedUpstream();

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
      },
    ]);
    degraded.restore();
  });

  // The NOUNS and LIL_NOUNS wiring reads auction prices from PostgreSQL before
  // it calls CoinGecko, so a database error reaches this handler too.
  it("returns 500 and counts nothing when the failure is not the provider", async () => {
    const app = buildApp({
      getHistoricalTokenData: async () => {
        throw new Error("connection terminated unexpectedly");
      },
    });
    const degraded = captureDegradedUpstream();

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(500);
    expect(degraded.recorded()).toEqual([]);
    degraded.restore();
  });

  it("keeps a 503 that is not an upstream failure as a 503", async () => {
    const app = buildApp({
      getHistoricalTokenData: async () => {
        throw new HTTPException(503, { message: "Service unavailable" });
      },
    });
    const degraded = captureDegradedUpstream();

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(503);
    expect(degraded.recorded()).toEqual([]);
    degraded.restore();
  });

  it("keeps client errors such as an unlisted token and does not count them", async () => {
    const app = buildApp({
      getHistoricalTokenData: async () => {
        throw new HTTPException(404, { message: "Token not found" });
      },
    });
    const degraded = captureDegradedUpstream();

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(404);
    expect(degraded.recorded()).toEqual([]);
    degraded.restore();
  });
});
