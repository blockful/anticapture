import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it } from "vitest";

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
        throw new HTTPException(503, { message: "CoinGecko down" });
      },
    });

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("keeps client errors such as an unlisted token", async () => {
    const app = buildApp({
      getHistoricalTokenData: async () => {
        throw new HTTPException(404, { message: "Token not found" });
      },
    });

    const res = await app.request("/token/historical-data?limit=7");

    expect(res.status).toBe(404);
  });
});
