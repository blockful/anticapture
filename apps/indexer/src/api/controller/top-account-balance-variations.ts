import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import {
  TopAccountBalanceVariationsMapper,
  TopAccountBalanceVariationsRequestSchema,
  TopAccountBalanceVariationsResponseSchema,
} from "../mappers/top-account-balance-variations";
import { AccountBalanceService } from "../services/account-balance";

export function topAccountBalanceVariations(
  app: Hono,
  service: AccountBalanceService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "topAccountBalanceVariations",
      path: "/voting-power/variations",
      summary: "Get top changes in account balances for a given period",
      description:
        "Returns a mapping of the biggest changes to account balances associated by delegate address",
      tags: ["transactions"],
      request: {
        query: TopAccountBalanceVariationsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved account balance changes",
          content: {
            "application/json": {
              schema: TopAccountBalanceVariationsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, limit, skip, orderDirection } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);

      const result = await service.getTopAccountBalanceVariations(
        now,
        days,
        skip,
        limit,
        orderDirection,
      );

      return context.json(TopAccountBalanceVariationsMapper(result, now, days));
    },
  );
}
