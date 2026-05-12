import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationPercentageRequestSchema,
  DelegationPercentageResponseSchema,
  toApi,
} from "@/mappers/";
import { setCacheControl } from "@/middlewares";
import { DelegationPercentageService } from "@/services";

// TODO(schema-fix): this endpoint is the only one still using before/after cursor
// pagination; everything else uses skip/limit. Migrate the request schema, the
// service, and the response shape together (see TODOs in the mapper and service).
export function delegationPercentage(
  app: Hono,
  service: DelegationPercentageService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "delegationPercentageByDay",
      path: "/delegation-percentage",
      summary: "Get delegation percentage day buckets with forward-fill",
      tags: ["metrics"],
      middleware: [setCacheControl(3600)],
      request: {
        query: DelegationPercentageRequestSchema,
      },
      responses: {
        200: {
          description: "Delegation percentage data with pagination",
          content: {
            "application/json": { schema: DelegationPercentageResponseSchema },
          },
        },
      },
    }),
    async (ctx) => {
      const query = ctx.req.valid("query");
      const serviceResult = await service.delegationPercentageByDay(query);
      return ctx.json(toApi(serviceResult), 200);
    },
  );
}
