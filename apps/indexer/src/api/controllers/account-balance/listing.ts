import { createRoute, OpenAPIHono as Hono } from "@hono/zod-openapi";
import { AccountBalanceService } from "@/api/services";
import {
  AccountBalancesRequestSchema,
  AccountBalancesResponseMapper,
  AccountBalancesResponseSchema,
} from "@/api/mappers";
import { Address } from "viem";

export function accountBalances(app: Hono, service: AccountBalanceService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalances",
      path: "/account-balances",
      summary: "Get account balances",
      description: "Returns account balances",
      tags: ["transactions"],
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
        includeAddresses as Address[],
        excludeAddresses as Address[],
        includeDelegates as Address[],
        excludeDelegates as Address[],
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
