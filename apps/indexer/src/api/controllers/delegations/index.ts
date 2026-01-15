import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationMapper,
  DelegationsRequestSchema,
  DelegationsResponseSchema,
} from "@/api/mappers/delegations";
import { DelegationsService } from "@/api/services/delegations";

export function delegations(app: Hono, service: DelegationsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "delegations",
      path: "/delegations",
      summary: "Get delegations",
      description: "Get delegations, with optional filtering and sorting",
      tags: ["delegations"],
      request: {
        query: DelegationsRequestSchema,
      },
      responses: {
        200: {
          description:
            "Returns transactions with their transfers and delegations",
          content: {
            "application/json": {
              schema: DelegationsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        delegatorAccountId,
        // delegateAccountId,
        // minDelta,
        // maxDelta,
        skip,
        limit,
        // orderBy,
        orderDirection,
      } = context.req.valid("query");

      const result = await service.getHistoricalDelegations(
        delegatorAccountId,
        // delegateAccountId,
        // minDelta,
        // maxDelta,
        orderDirection,
        skip,
        limit,
        // orderBy,
      );

      return context.json({
        items: result.map(DelegationMapper.toApi),
        totalCount: 0,
      });
    },
  );
}
