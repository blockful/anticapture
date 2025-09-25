import { z, OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaysOpts } from "@/lib/enums";
import { TokenValueResponseSchema, TokenValueResponseType } from "../mappers";

export interface TokenHistoricalDataClient {
  getHistoricalTokenData(days: number): Promise<TokenValueResponseType>;
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
        query: z.object({
          days: z
            .enum(DaysOpts)
            .optional()
            .default("365d")
            .transform((val) => parseInt(val.replace("d", ""))),
        }),
      },
      responses: {
        200: {
          description: "Returns the historical market data for the token",
          content: {
            "application/json": {
              schema: TokenValueResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");
      const data = await client.getHistoricalTokenData(days);
      return context.json(data, 200);
    },
  );
}
