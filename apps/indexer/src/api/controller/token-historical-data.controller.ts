import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import {
  CoingeckoTokenId,
  CoingeckoTokenIdEnum,
  CoingeckoHistoricalMarketData,
} from "../services/coingecko/types";
import { DAYS_IN_YEAR } from "@/lib/constants";

interface TokenHistoricalDataClient {
  getHistoricalTokenData(
    tokenId: CoingeckoTokenId,
    days: number
  ): Promise<CoingeckoHistoricalMarketData>;
}

export function tokenHistoricalData(
  app: Hono,
  client: TokenHistoricalDataClient
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalTokenData",
      path: "/token/{daoId}/historical-data",
      summary: "Get historical token data",
      description: "Get historical market data for a specific token",
      tags: ["tokens"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
      },
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
      },
    }),
    async (context) => {
      const { daoId } = context.req.valid("param");

      const data = await client.getHistoricalTokenData(
        CoingeckoTokenIdEnum[daoId],
        DAYS_IN_YEAR
      );

      return context.json(data, 200);
    }
  );
}
