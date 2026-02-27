import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationsRequestParamsSchema,
  DelegationsRequestQuerySchema,
  DelegationItemSchema,
} from "@/mappers/delegations";
import { DelegationsService } from "@/services/delegations/current";

export function delegations(app: Hono, service: DelegationsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "delegations",
      path: "/accounts/{address}/delegations",
      summary: "Get delegation",
      description: "Get current delegator of an account",
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
              schema: DelegationItemSchema.nullable(),
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

      if (!result) return context.json(null); // TODO: graphql-mesh can't handle the null value

      return context.json(DelegationItemSchema.parse(result));
    },
  );
}
