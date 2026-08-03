import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { env } from "@/env";
import { HealthResponseSchema } from "@/schemas/health";

export function health(app: Hono) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "health",
      path: "/health",
      summary: "Relayer health check",
      tags: ["system"],
      responses: {
        200: {
          description: "Health status",
          content: {
            "application/json": { schema: HealthResponseSchema },
          },
        },
      },
    }),
    async (c) =>
      c.json(
        { status: "ok" as const, commit: env.RAILWAY_GIT_COMMIT_SHA },
        200,
      ),
  );
}
