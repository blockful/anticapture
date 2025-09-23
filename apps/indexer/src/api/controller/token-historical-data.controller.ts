import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaoIdEnum, DaysEnum, DaysOpts } from "@/lib/enums";
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
    toCurrency: string,
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
      request: {
        query: z.object({
          toCurrency: z.string().default("usd"),
          days: z
            .enum(DaysOpts)
            .default("7d")
            .transform((val) => DaysEnum[val]),
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
      const { toCurrency, days } = context.req.query();

      const daysNumber = Number(days) || DAYS_IN_YEAR;
      const currency = toCurrency || "usd";

      const tokenId =
        CoingeckoTokenIdEnum[daoId as keyof typeof CoingeckoTokenIdEnum];
      const data = await client.getHistoricalTokenData(
        tokenId,
        daysNumber,
        currency,
      );

      return context.json(data, 200);
    },
  );
}
