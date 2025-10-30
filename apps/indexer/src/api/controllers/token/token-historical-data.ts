import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  TokenHistoricalPriceRequest,
  TokenHistoricalPriceResponse,
} from "@/api/mappers";

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
      tags: ["tokens"],
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
      const data = await client.getHistoricalTokenData(limit, skip);
      return context.json(data, 200);
    },
  );
}
