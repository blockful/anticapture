import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

import type { Drizzle } from "@/database";

const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  database: z.literal("ok"),
});

const UnhealthyResponseSchema = z.object({
  status: z.literal("error"),
  database: z.literal("error"),
  message: z.string(),
});

export function health(app: Hono, db: Pick<Drizzle, "execute">) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "health",
      path: "/health",
      summary: "Check API and database health",
      tags: ["system"],
      responses: {
        200: {
          description: "API and database are healthy",
          content: {
            "application/json": {
              schema: HealthResponseSchema,
            },
          },
        },
        503: {
          description: "Database connectivity check failed",
          content: {
            "application/json": {
              schema: UnhealthyResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      try {
        await db.execute(sql`select 1`);

        return context.json(
          {
            status: "ok",
            database: "ok",
          } as const,
          200,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Database health check failed";

        return context.json(
          {
            status: "error",
            database: "error",
            message,
          } as const,
          503,
        );
      }
    },
  );
}
