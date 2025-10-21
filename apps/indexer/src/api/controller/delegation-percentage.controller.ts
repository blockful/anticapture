import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { DelegationPercentageService } from "@/api/services/delegation-percentage";
import {
  DelegationPercentageQuerySchema,
  DelegationPercentageResponseSchema,
  mapServiceToHttpResponse,
} from "@/api/mappers/delegation-percentage";

export function delegationPercentage(
  app: Hono,
  service: DelegationPercentageService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getDelegationPercentage",
      path: "/delegation-percentage",
      summary: "Get delegation percentage day buckets with forward-fill",
      tags: ["metrics"],
      request: {
        query: DelegationPercentageQuerySchema,
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
      const serviceResult = await service.getDelegationPercentage(
        ctx.req.valid("query"),
      );
      const httpResponse = mapServiceToHttpResponse(serviceResult);

      return ctx.json(httpResponse);
    },
  );
}
