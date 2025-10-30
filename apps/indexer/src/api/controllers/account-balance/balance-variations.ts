import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import {
  AccountBalanceVariationsMapper,
  AccountBalanceVariationsRequestSchema,
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
      path: "/account-balance/variations",
      summary: "Get top variations in account balances for a given period",
      description:
        "Returns a mapping of the biggest variations to account balances associated by account address",
      tags: ["transactions"],
      request: {
        query: AccountBalanceVariationsRequestSchema,
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
      const { days, limit, skip, orderDirection } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);

      const result = await service.getAccountBalanceVariations(
        now - days,
        skip,
        limit,
        orderDirection,
      );

      return context.json(AccountBalanceVariationsMapper(result, now, days));
    },
  );
}
