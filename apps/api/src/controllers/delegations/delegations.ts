import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationsResponseSchema,
  DelegationsRequestParamsSchema,
  DelegationsRequestQuerySchema,
} from "@/mappers/delegations";
import { DelegationsService } from "@/services/delegations/current";

export function delegations(app: Hono, service: DelegationsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "delegations",
      path: "/accounts/{address}/delegations",
      summary: "Get delegations",
      description: "Get current delegators of an account",
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
      const { orderBy, orderDirection } = context.req.valid("query");

      const result = await service.getDelegations(address, {
        orderBy,
        orderDirection,
      });

      return context.json(
        DelegationsResponseSchema.parse({
          items: result,
          totalCount: result.length,
        }),
      );
    },
  );
}
