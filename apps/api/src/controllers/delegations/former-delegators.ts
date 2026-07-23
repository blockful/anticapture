import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  FormerDelegatorsRequestParamsSchema,
  FormerDelegatorsRequestQuerySchema,
  FormerDelegatorsResponseSchema,
} from "@/mappers/delegations/former-delegators";
import { setCacheControl } from "@/middlewares";
import { FormerDelegatorsService } from "@/services/delegations/former-delegators";

export function formerDelegators(app: Hono, service: FormerDelegatorsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "formerDelegators",
      path: "/accounts/{address}/delegators/historical",
      summary: "Get former delegators",
      description:
        "Get delegators that delegated to an account in the past but whose latest delegation is no longer to it",
      tags: ["delegations", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        params: FormerDelegatorsRequestParamsSchema,
        query: FormerDelegatorsRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Returns former delegators for an account",
          content: {
            "application/json": {
              schema: FormerDelegatorsResponseSchema,
            },
          },
        },
      },
    }),

    async (context) => {
      const { address } = context.req.valid("param");
      const { skip, limit, orderDirection } = context.req.valid("query");

      const result = await service.getFormerDelegators(
        address,
        skip,
        limit,
        orderDirection,
      );

      return context.json(FormerDelegatorsResponseSchema.parse(result), 200);
    },
  );
}
