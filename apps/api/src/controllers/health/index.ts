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

const HEALTHCHECK_FAILURE_MESSAGE = "Database health check failed";

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
        console.error("Health check database ping failed", error);

        return context.json(
          {
            status: "error",
            database: "error",
            message: HEALTHCHECK_FAILURE_MESSAGE,
          } as const,
          503,
        );
      }
    },
  );
}
