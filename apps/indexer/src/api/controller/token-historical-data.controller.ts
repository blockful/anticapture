import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaoIdEnum } from "@/lib/enums";
import {
  TokenHistoricalPriceRequest,
  TokenHistoricalPriceResponse,
} from "../mappers";
interface TokenHistoricalDataClient {
  getHistoricalTokenData(
    daoId: DaoIdEnum,
    days: number,
  ): Promise<TokenHistoricalPriceResponse>;
}

export function tokenHistoricalData(
  app: Hono,
  client: TokenHistoricalDataClient,
  daoId: DaoIdEnum,
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
      const { days } = context.req.valid("query");
      const data = await client.getHistoricalTokenData(daoId, days);
      return context.json(data, 200);
    },
  );
}
