import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { setCacheControl } from "@/middlewares";
import { HealthService } from "@/services";

const HealthResponseSchema = z
  .object({
    status: z.enum(["ok", "degraded", "error"]).openapi({
      description:
        "Overall health: ok when fresh, degraded when indexer is lagging, error when the database is unreachable.",
    }),
    database: z.enum(["ok", "error"]).openapi({
      description: "Database connectivity status.",
    }),
    chain: z
      .object({
        head: z.number().int().nullable().openapi({
          description:
            "Latest block number reported by the RPC, or null if the RPC call failed.",
        }),
      })
      .openapi({ description: "On-chain state observed by this DAO API." }),
    indexer: z
      .object({
        lastEventTimestamp: z.number().int().nullable().openapi({
          description:
            "Unix timestamp (seconds) of the most recent indexed event, or null if no events have been recorded.",
        }),
        lagSeconds: z.number().int().nullable().openapi({
          description:
            "Seconds between now and lastEventTimestamp, or null if the indexer hasn't produced any events.",
        }),
        fresh: z.boolean().openapi({
          description:
            "True when lagSeconds is within the freshness threshold (300s).",
        }),
      })
      .openapi({
        description: "Indexer freshness signals derived from app tables.",
      }),
  })
  .openapi("HealthResponse");

export function health(app: Hono, service: HealthService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "health",
      path: "/health",
      summary: "Per-DAO indexer and database health",
      description:
        "Returns database connectivity, chain head, indexer freshness, and computed lag for this DAO API.",
      tags: ["system"],
      middleware: [setCacheControl(5)],
      responses: {
        200: {
          description: "Health snapshot (status may be ok or degraded).",
          content: {
            "application/json": {
              schema: HealthResponseSchema,
            },
          },
        },
        503: {
          description: "Database connectivity check failed.",
          content: {
            "application/json": {
              schema: HealthResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const report = await service.getHealth();
      return context.json(report, report.database === "error" ? 503 : 200);
    },
  );
}
