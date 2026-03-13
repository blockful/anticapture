import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  HistoricalBalancesResponseMapper,
  HistoricalBalanceRequestParamsSchema,
  HistoricalBalanceRequestQuerySchema,
  HistoricalBalancesResponseSchema,
} from "@/mappers";
import { HistoricalBalancesService } from "@/services";

export function historicalBalances(
  app: Hono,
  service: HistoricalBalancesService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalBalances",
      path: "/accounts/{address}/balances/historical",
      summary: "Get historical token balances",
      description: "TODO",
      tags: ["account-balances"],
      request: {
        params: HistoricalBalanceRequestParamsSchema,
        query: HistoricalBalanceRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved historical balances",
          content: {
            "application/json": {
              schema: HistoricalBalancesResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { address } = context.req.valid("param");
      const {
        skip,
        limit,
        orderDirection,
        orderBy,
        fromValue,
        toValue,
        fromDate,
        toDate,
      } = context.req.valid("query");

      const { items, totalCount } = await service.getHistoricalBalances(
        address,
        skip,
        limit,
        orderDirection,
        orderBy,
        fromValue,
        toValue,
        fromDate,
        toDate,
      );

      return context.json(HistoricalBalancesResponseMapper(items, totalCount));
    },
  );
}
