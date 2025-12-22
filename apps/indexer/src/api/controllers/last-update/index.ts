import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { ChartType } from "@/api/mappers";
import { LastUpdateService } from "@/api/services";

export function lastUpdate(app: Hono, service: LastUpdateService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "lastUpdate",
      path: "/last-update",
      summary: "Get the last update time",
      request: {
        query: z.object({
          chart: z.nativeEnum(ChartType),
        }),
      },
      responses: {
        200: {
          description: "Last update time",
          content: {
            "application/json": {
              schema: z.object({
                lastUpdate: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { chart } = context.req.valid("query");
      const lastUpdate = await service.getLastUpdate(chart);
      return context.json({ lastUpdate }, 200);
    },
  );
}
