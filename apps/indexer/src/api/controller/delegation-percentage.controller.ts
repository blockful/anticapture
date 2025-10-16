import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { DelegationPercentageService } from "@/api/services/delegation-percentage";
import { DelegationPercentageResponseSchema } from "@/api/mappers/delegation-percentage";

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
        query: z.object({
          after: z.string().optional(),
          before: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          orderDirection: z.enum(["asc", "desc"]).default("asc"),
          limit: z.coerce.number().int().positive().max(1000).default(100),
        }),
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
      const { after, before, startDate, endDate, orderDirection, limit } =
        ctx.req.valid("query");

      const result = await service.getDelegationPercentage({
        after,
        before,
        startDate,
        endDate,
        orderDirection,
        limit,
      });

      return ctx.json(result);
    },
  );
}
