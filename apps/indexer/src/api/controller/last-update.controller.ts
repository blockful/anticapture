import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { ChartType } from "../mappers/last-update";
import { LastUpdateService } from "../services/last-update/last-update.service";
import { LastUpdateRepository } from "../repositories/last-update.repository";

export function lastUpdate(app: Hono) {
  const repository = new LastUpdateRepository();
  const service = new LastUpdateService(repository);
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
                lastUpdate: z.string().nullable(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { chart } = context.req.valid("query");

      try {
        const lastUpdate = await service.getLastUpdate(chart);
        return context.json({ lastUpdate }, 200);
      } catch (error) {
        console.error("Error getting last update:", error);
        return context.json({ lastUpdate: null }, 200);
      }
    },
  );
}
