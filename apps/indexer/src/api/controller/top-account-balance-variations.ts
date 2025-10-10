import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import {
  TopAccountBalanceVariationsMapper,
  TopAccountBalanceVariationsRequestSchema,
  TopAccountBalanceVariationsResponseSchema,
} from "../mappers";
import { TopBalanceVariationsService } from "../services";

export function topAccountBalanceVariations(
  app: Hono,
  service: TopBalanceVariationsService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "topAccountBalanceVariations",
      path: "/account-balance/variations",
      summary: "Get top variations in account balances for a given period",
      description:
        "Returns a mapping of the biggest variations to account balances associated by account address",
      tags: ["transactions"],
      request: {
        query: TopAccountBalanceVariationsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved account balance variations",
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
