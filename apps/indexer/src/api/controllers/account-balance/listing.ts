import { createRoute, OpenAPIHono as Hono } from "@hono/zod-openapi";
import { AccountBalanceService } from "@/api/services";
import {
  AccountBalancesRequestSchema,
  AccountBalancesResponseMapper,
  AccountBalancesResponseSchema,
} from "@/api/mappers";

export function accountBalances(app: Hono, service: AccountBalanceService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalances",
      path: "/account-balances",
      summary: "Get account balances",
      description: "Returns account balances",
      tags: ["account-balances"],
      request: {
        query: AccountBalancesRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved account balances",
          content: {
            "application/json": {
              schema: AccountBalancesResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        includeAddresses,
        excludeAddresses,
        includeDelegates,
        excludeDelegates,
        balanceLessThan,
        balanceGreaterThan,
        limit,
        skip,
        orderDirection,
      } = context.req.valid("query");

      const result = await service.getAccountBalances(
        skip,
        limit,
        orderDirection,
        includeAddresses,
        excludeAddresses,
        includeDelegates,
        excludeDelegates,
        {
          minAmount: balanceGreaterThan,
          maxAmount: balanceLessThan,
        },
      );

      return context.json(
        AccountBalancesResponseMapper(result.items, result.totalCount),
      );
    },
  );
}
