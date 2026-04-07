import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationPercentageRequestSchema,
  DelegationPercentageResponseSchema,
  toApi,
} from "@/mappers/";
import { DelegationPercentageService } from "@/services";

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
      ctx.header("Cache-Control", "public, max-age=300");
      return ctx.json(toApi(serviceResult), 200);
    },
  );
}
