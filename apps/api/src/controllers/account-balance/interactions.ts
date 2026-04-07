import { Address } from "viem";
import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  AccountInteractions,
  AccountInteractionsMapper,
  AccountInteractionsParamsSchema,
  AccountInteractionsQuerySchema,
  AccountInteractionsResponseSchema,
  Filter,
} from "../../mappers";

interface InteractionsService {
  getAccountInteractions(
    accountId: Address,
    fromTimestamp: number | undefined,
    toTimestamp: number | undefined,
    skip: number,
    limit: number,
    orderBy: "volume" | "count",
    orderDirection: "asc" | "desc",
    filter: Filter,
  ): Promise<AccountInteractions>;
}

export function accountInteractions(app: Hono, service: InteractionsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountInteractions",
      path: "/balances/{address}/interactions",
      summary: "Get top interactions between accounts for a given period",
      description: `Returns a mapping of the largest interactions between accounts. 
Positive amounts signify net token transfers FROM <address>, whilst negative amounts refer to net transfers TO <address>`,
      tags: ["account-balances"],
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
        fromDate,
        toDate,
        limit,
        skip,
        orderBy,
        orderDirection,
        minAmount,
        maxAmount,
        filterAddress,
      } = context.req.valid("query");

      const result = await service.getAccountInteractions(
        address,
        fromDate,
        toDate,
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

      context.header("Cache-Control", "public, max-age=120");
      return context.json(
        AccountInteractionsMapper(result, fromDate, toDate),
        200,
      );
    },
  );
}
