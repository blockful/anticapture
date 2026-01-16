import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationResponseMapper,
  HistoricalDelegationsRequestParamsSchema,
  HistoricalDelegationsRequestQuerySchema,
  DelegationsResponseSchema,
} from "@/api/mappers/delegations";
import { HistoricalDelegationsService } from "@/api/services/delegations";

export function historicalDelegations(
  app: Hono,
  service: HistoricalDelegationsService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalDelegations",
      path: "/accounts/{address}/delegations/historical",
      summary: "Get historical delegations",
      description:
        "Get historical delegations for an account, with optional filtering and sorting",
      tags: ["delegations"],
      request: {
        params: HistoricalDelegationsRequestParamsSchema,
        query: HistoricalDelegationsRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Returns historical delegations for an account",
          content: {
            "application/json": {
              schema: DelegationsResponseSchema,
            },
          },
        },
      },
    }),

    async (context) => {
      const { address } = context.req.valid("param");

      const {
        fromValue,
        toValue,
        delegateAddressIn,
        skip,
        limit,
        orderDirection,
      } = context.req.valid("query");

      const result = await service.getHistoricalDelegations(
        address,
        fromValue,
        toValue,
        delegateAddressIn,
        orderDirection,
        skip,
        limit,
      );

      return context.json(DelegationResponseMapper(result));
    },
  );
}
