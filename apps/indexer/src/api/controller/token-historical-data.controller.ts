import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaoIdEnum } from "@/lib/enums";
import {
  CoingeckoTokenId,
  CoingeckoTokenIdEnum,
  CoingeckoHistoricalMarketData,
} from "../services/coingecko/types";
import { DAYS_IN_YEAR } from "@/lib/constants";

interface TokenHistoricalDataClient {
  getHistoricalTokenData(
    tokenId: CoingeckoTokenId,
    days: number,
  ): Promise<CoingeckoHistoricalMarketData>;
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
      request: {},
      responses: {
        200: {
          description: "Returns the historical market data for the token",
          content: {
            "application/json": {
              schema: z.object({
                prices: z.array(z.tuple([z.number(), z.number()])),
                market_caps: z.array(z.tuple([z.number(), z.number()])),
                total_volumes: z.array(z.tuple([z.number(), z.number()])),
              }),
            },
          },
        },
        400: {
          description: "Bad request - DAO not supported for historical data",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      // Validate that daoId is supported by Coingecko
      if (!(daoId in CoingeckoTokenIdEnum)) {
        return context.json(
          { error: `Token historical data not supported for DAO: ${daoId}` },
          400,
        );
      }

      const tokenId =
        CoingeckoTokenIdEnum[daoId as keyof typeof CoingeckoTokenIdEnum];
      const data = await client.getHistoricalTokenData(tokenId, DAYS_IN_YEAR);

      return context.json(data, 200);
    },
  );
}
