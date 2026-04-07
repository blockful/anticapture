import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { Drizzle } from "@/database";
import { LastUpdateQuerySchema, LastUpdateResponseSchema } from "@/mappers/";
import { LastUpdateRepositoryImpl } from "@/repositories";
import { LastUpdateService } from "@/services";

export function lastUpdate(app: Hono, db: Drizzle) {
  const repository = new LastUpdateRepositoryImpl(db);
  const service = new LastUpdateService(repository);
  app.openapi(
    createRoute({
      method: "get",
      operationId: "lastUpdate",
      path: "/last-update",
      summary: "Get the last update time",
      tags: ["metrics"],
      request: {
        query: LastUpdateQuerySchema,
      },
      responses: {
        200: {
          description: "Last update time",
          content: {
            "application/json": {
              schema: LastUpdateResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { chart } = context.req.valid("query");
      const lastUpdate = await service.getLastUpdate(chart);
      context.header("Cache-Control", "public, max-age=30");
      return context.json({ lastUpdate }, 200);
    },
  );
}
