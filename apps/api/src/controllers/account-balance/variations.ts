import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaysEnum } from "@/lib/enums";
import {
  AccountBalanceVariationsByAccountIdRequestQuerySchema,
  AccountBalanceVariationsResponseMapper,
  AccountBalanceVariationsByAccountIdRequestParamsSchema,
  AccountBalanceVariationsRequestQuerySchema,
  AccountBalanceVariationsResponseSchema,
  AccountBalanceVariationsByAccountIdResponseMapper,
  AccountBalanceVariationsByAccountIdResponseSchema,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";
import { BalanceVariationsService } from "@/services";

export function accountBalanceVariations(
  app: Hono,
  service: BalanceVariationsService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalanceVariations",
      path: "/balances/variations",
      summary: "Get variations in account balances for a given period",
      description:
        "Returns a mapping of the biggest variations to account balances associated by account address",
      tags: ["account-balances", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        query: AccountBalanceVariationsRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved account balance variations",
          content: {
            "application/json": {
              schema: AccountBalanceVariationsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { fromDate, toDate, limit, skip, orderDirection, addresses } =
        context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);
      const effectiveFromDate = fromDate ?? now - DaysEnum["90d"];
      const effectiveToDate = toDate ?? now;

      const result = await service.getAccountBalanceVariations(
        effectiveFromDate,
        effectiveToDate,
        limit,
        skip,
        orderDirection,
        addresses,
      );

      return context.json(
        AccountBalanceVariationsResponseMapper(result, fromDate, toDate),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalanceVariationsByAccountId",
      path: "/accounts/{address}/balances/variations",
      summary: "Get changes in balance for a given period for a single account",
      description: "Returns a the changes to balance by period and accountId",
      tags: ["account-balances"],
      middleware: [setCacheControl(60)],
      request: {
        params: AccountBalanceVariationsByAccountIdRequestParamsSchema,
        query: AccountBalanceVariationsByAccountIdRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved account balance variations",
          content: {
            "application/json": {
              schema: AccountBalanceVariationsByAccountIdResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { address } = context.req.valid("param");
      const { fromDate, toDate } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);
      const effectiveFromDate = fromDate ?? now - DaysEnum["90d"];
      const effectiveToDate = toDate ?? now;

      const result = await service.getAccountBalanceVariationsByAccountId(
        address,
        effectiveFromDate,
        effectiveToDate,
      );

      return context.json(
        AccountBalanceVariationsByAccountIdResponseMapper(
          result,
          fromDate,
          toDate,
        ),
        200,
      );
    },
  );
}
