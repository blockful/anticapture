import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { setCacheControl } from "@/middlewares";
import { HealthService } from "@/services";

const LivenessResponseSchema = z
  .object({
    database: z.enum(["ok", "error"]).openapi({
      description: "Database connectivity status.",
    }),
  })
  .openapi("LivenessResponse");

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
      operationId: "liveness",
      path: "/health",
      summary: "Liveness probe",
      description:
        "Lightweight liveness probe for orchestrators (e.g. Railway). Returns 200 when the API process is up and the database is reachable, 503 otherwise. Indexer freshness and chain head are intentionally excluded — use /health/full for diagnostics.",
      tags: ["system"],
      middleware: [setCacheControl(5)],
      responses: {
        200: {
          description: "API process is up and database is reachable.",
          content: {
            "application/json": {
              schema: LivenessResponseSchema,
            },
          },
        },
        503: {
          description: "Database connectivity check failed.",
          content: {
            "application/json": {
              schema: LivenessResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const database = await service.getLiveness();
      return context.json({ database }, database === "error" ? 503 : 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "health",
      path: "/health/full",
      summary: "Full health snapshot (database, chain head, indexer freshness)",
      description:
        "Returns database connectivity, chain head, indexer freshness, and computed lag for this DAO API. HTTP status reflects database reachability only; degraded indexer state still returns 200 with status='degraded' in the body.",
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
