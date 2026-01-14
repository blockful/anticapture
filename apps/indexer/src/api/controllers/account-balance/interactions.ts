import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  AccountInteractionsMapper,
  AccountInteractionsParamsSchema,
  AccountInteractionsQuerySchema,
  AccountInteractionsResponseSchema,
} from "../../mappers";
import { BalanceVariationsService } from "../../services";

export function accountInteractions(
  app: Hono,
  service: BalanceVariationsService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountInteractions",
      path: "/balances/{address}/interactions",
      summary: "Get top interactions between accounts for a given period",
      description: `Returns a mapping of the largest interactions between accounts. 
Positive amounts signify net token transfers FROM <address>, whilst negative amounts refer to net transfers TO <address>`,
      tags: ["transactions"],
      request: {
        params: AccountInteractionsParamsSchema,
        query: AccountInteractionsQuerySchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved account interactions",
          content: {
            "application/json": {
              schema: AccountInteractionsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { address } = context.req.valid("param");
      const {
        days,
        limit,
        skip,
        orderBy,
        orderDirection,
        minAmount,
        maxAmount,
        filterAddress,
      } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);

      const result = await service.getAccountInteractions(
        address,
        now - days,
        skip,
        limit,
        orderBy,
        orderDirection,
        {
          address: filterAddress,
          minAmount,
          maxAmount,
        },
      );

      return context.json(AccountInteractionsMapper(result, now, days));
    },
  );
}
