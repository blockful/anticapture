import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import {
  AccountBalanceVariationsMapper,
  AccountBalanceVariationsRequestParamsSchema,
  AccountBalanceVariationsRequestQuerySchema,
  AccountBalanceVariationsResponseSchema,
} from "@/api/mappers";
import { BalanceVariationsService } from "@/api/services";

export function accountBalanceVariations(
  app: Hono,
  service: BalanceVariationsService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalanceVariations",
      path: "/balances/variations",
      summary: "Get top variations in account balances for a given period",
      description:
        "Returns a mapping of the biggest variations to account balances associated by account address",
      tags: ["transactions"],
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
      const { fromDate, toDate, limit, skip, orderDirection } =
        context.req.valid("query");

      const result = await service.getAccountBalanceVariations(
        fromDate,
        toDate,
        skip,
        limit,
        orderDirection,
      );

      return context.json(
        AccountBalanceVariationsMapper(result, fromDate, toDate),
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalanceVariationsByAccountId",
      path: "/balances/{address}/variations",
      summary:
        "Get top changes in balance for a given period for a single account",
      description:
        "Returns a the changes to voting power by period and accountId",
      tags: ["transactions"],
      request: {
        params: AccountBalanceVariationsRequestParamsSchema,
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
      const { address } = context.req.valid("param");
      const { fromDate, toDate, limit, skip, orderDirection } =
        context.req.valid("query");

      const result = await service.getAccountBalanceVariationsByAccountId(
        address,
        fromDate,
        toDate,
        skip,
        limit,
        orderDirection,
      );

      return context.json(
        AccountBalanceVariationsMapper(result, fromDate, toDate),
      );
    },
  );
}
