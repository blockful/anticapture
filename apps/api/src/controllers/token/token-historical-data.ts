import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import { logger } from "@/logger";
import {
  TokenHistoricalPriceRequest,
  TokenHistoricalPriceResponse,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";

export interface TokenHistoricalDataClient {
  getHistoricalTokenData(
    limit: number,
    offset: number,
  ): Promise<TokenHistoricalPriceResponse>;
}

export function tokenHistoricalData(
  app: Hono,
  client: TokenHistoricalDataClient,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalTokenData",
      path: "/token/historical-data",
      summary: "Get historical token data",
      description: "Get historical market data for a specific token",
      tags: ["tokens", "skip-pagination"],
      middleware: [setCacheControl(3600)],
      request: {
        query: TokenHistoricalPriceRequest,
      },
      responses: {
        200: {
          description: "Returns the historical market data for the token",
          content: {
            "application/json": {
              schema: TokenHistoricalPriceResponse,
            },
          },
        },
      },
    }),
    async (context) => {
      const { skip, limit } = context.req.valid("query");
      try {
        const data = await client.getHistoricalTokenData(limit, skip);
        return context.json(data, 200);
      } catch (error) {
        // Client errors (e.g. token not listed) keep their status; anything
        // else degrades to an empty series. Price history is third-party data
        // and a 5xx here would trip the gateway circuit breaker for the DAO.
        if (error instanceof HTTPException && error.status < 500) throw error;
        logger.warn(
          { err: error },
          "historical token data unavailable; returning empty series",
        );
        // no-store keeps the gateway from caching the empty fallback for the
        // route's regular max-age once the provider recovers.
        return context.json([], 200, { "Cache-Control": "no-store" });
      }
    },
  );
}
