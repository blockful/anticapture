import { createRoute, OpenAPIHono as Hono, z } from "@hono/zod-openapi";
import { AccountBalanceService } from "@/services";
import {
  AccountBalancesRequestSchema,
  AccountBalancesWithVariationResponseMapper,
  AccountBalancesResponseSchema,
  AccountBalancesWithVariationResponseSchema,
} from "@/mappers";
import {
  AccountBalanceResponseMapper,
  AccountBalanceResponseSchema,
} from "@/mappers";
import { getAddress, isAddress } from "viem";
import { DaoIdEnum, DaysEnum } from "@/lib/enums";

export function accountBalances(
  app: Hono,
  daoId: DaoIdEnum,
  service: AccountBalanceService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalances",
      path: "/balances",
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
              schema: AccountBalancesWithVariationResponseSchema,
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
        orderBy,
        fromDate,
        toDate,
      } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);
      const ninetyDaysBack = now - DaysEnum["90d"]

      const result = await service.getAccountBalances(
        daoId,
        fromDate ?? ninetyDaysBack,
        toDate ?? now,
        skip,
        limit,
        orderDirection,
        orderBy,
        addresses,
        delegates,
        {
          minAmount: fromValue,
          maxAmount: toValue,
        },
      );

      return context.json(
        AccountBalancesWithVariationResponseMapper(result.items, result.totalCount),
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalanceByAccountId",
      path: "/accounts/{address}/balances",
      summary: "Get account balance",
      description: "Returns account balance information for a specific address",
      tags: ["account-balances"],
      request: {
        params: z.object({
          address: z
            .string()
            .refine((addr) => isAddress(addr, { strict: false }))
            .transform((addr) => getAddress(addr)),
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
      const { address } = context.req.valid("param");
      const result = await service.getAccountBalance(address);
      return context.json(AccountBalanceResponseMapper(result));
    },
  );
}
