import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegatorsResponseSchema,
  DelegatorsRequestParamsSchema,
  DelegatorsRequestQuerySchema,
} from "@/mappers/delegations/delegators";
import { DelegatorsService } from "@/services/delegations/delegators";

export function delegators(app: Hono, service: DelegatorsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "delegators",
      path: "/accounts/{address}/delegators",
      summary: "Get delegators",
      description: "Get current delegators of an account with voting power",
      tags: ["delegations"],
      request: {
        params: DelegatorsRequestParamsSchema,
        query: DelegatorsRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Returns current delegators for an account",
          content: {
            "application/json": {
              schema: DelegatorsResponseSchema,
            },
          },
        },
      },
    }),

    async (context) => {
      const { address } = context.req.valid("param");
      const { skip, limit, orderBy, orderDirection } =
        context.req.valid("query");

      const result = await service.getDelegators(address, skip, limit, {
        orderBy,
        orderDirection,
      });

      return context.json(DelegatorsResponseSchema.parse(result));
    },
  );
}
