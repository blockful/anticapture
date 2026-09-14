import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { recordDegradedUpstream } from "@/lib/degraded-upstream";
import { UpstreamUnavailableError } from "@/lib/upstream-error";
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
        // Only a price provider outage degrades to an empty series, because a
        // 5xx here would trip the gateway circuit breaker for the whole DAO.
        // Everything else keeps its status: the NOUNS and LIL_NOUNS path reads
        // auction prices from PostgreSQL first, and a database error or a
        // mapping bug there must stay a real error rather than a silent 200.
        if (!(error instanceof UpstreamUnavailableError)) throw error;
        recordDegradedUpstream({
          upstream: error.upstream,
          resource: "token_historical_prices",
          mode: "empty",
          error,
        });
        // no-store keeps the gateway from caching the empty fallback for the
        // route's regular max-age once the provider recovers.
        return context.json([], 200, { "Cache-Control": "no-store" });
      }
    },
  );
}
