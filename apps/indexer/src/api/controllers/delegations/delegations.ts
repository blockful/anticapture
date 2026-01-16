import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationsResponseSchema,
  DelegationMapper,
  DelegationsRequestQuerySchema,
  DelegationsRequestParamsSchema,
} from "@/api/mappers/delegations";
import { DelegationsService } from "@/api/services/delegations";

export function delegations(app: Hono, service: DelegationsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "delegations",
      path: "/accounts/{address}/delegations",
      summary: "Get delegations",
      description: "Get delegations for an account",
      tags: ["delegations"],
      request: {
        params: DelegationsRequestParamsSchema,
        query: DelegationsRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Returns delegations for an account",
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

      const result = await service.getDelegations(address);

      return context.json({
        items: result.map(DelegationMapper),
        totalCount: result.length,
      });
    },
  );
}
