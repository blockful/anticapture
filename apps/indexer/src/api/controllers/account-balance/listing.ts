import { createRoute, OpenAPIHono as Hono, z } from "@hono/zod-openapi";
import { AccountBalanceService } from "@/api/services";
import {
  AccountBalancesRequestSchema,
  AccountBalancesResponseMapper,
  AccountBalancesResponseSchema,
} from "@/api/mappers";
import {
  AccountBalanceResponseMapper,
  AccountBalanceResponseSchema,
} from "@/api/mappers";
import { Address, isAddress } from "viem";
import { DaoIdEnum } from "@/lib/enums";

export function accountBalances(
  app: Hono,
  daoId: DaoIdEnum,
  service: AccountBalanceService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalances",
      path: "/account-balances",
      summary: "Get account balance records",
      description: "Returns sorted and paginated account balance records",
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
        addresses,
        delegates,
        toValue,
        fromValue,
        limit,
        skip,
        orderDirection,
      } = context.req.valid("query");

      const result = await service.getAccountBalances(
        daoId,
        skip,
        limit,
        orderDirection,
        addresses,
        delegates,
        {
          minAmount: fromValue,
          maxAmount: toValue,
        },
      );

      return context.json(
        AccountBalancesResponseMapper(result.items, result.totalCount),
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalanceByAccountId",
      path: "/account-balances/{accountId}",
      summary: "Get account balance",
      description:
        "Returns account balance information for a specific address (account)",
      tags: ["account-balances"],
      request: {
        params: z.object({
          accountId: z.string().refine((addr) => isAddress(addr)),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved account balance",
          content: {
            "application/json": {
              schema: AccountBalanceResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const accountId = context.req.param("accountId");
      const result = await service.getAccountBalance(accountId as Address);
      return context.json(AccountBalanceResponseMapper(result));
    },
  );
}
