import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationsRequestParamsSchema,
  DelegationsResponseSchema,
} from "@/mappers/delegations";
import {} from "@/mappers";
import { setCacheControl } from "@/middlewares";

import { DelegationsService } from "@/services/delegations/current";

export function delegations(app: Hono, service: DelegationsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "delegations",
      path: "/accounts/{address}/delegations",
      summary: "Get delegations",
      description: "Get current delegations for an account",
      tags: ["delegations"],
      middleware: [setCacheControl(60)],
      request: {
        params: DelegationsRequestParamsSchema,
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

      return context.json(DelegationsResponseSchema.parse(result), 200);
    },
  );
}
