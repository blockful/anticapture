import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";

import { UsageBatchBodySchema } from "@/mappers/tokens";
import type { TokensService } from "@/services/tokens";

export function usageController(app: Hono, service: TokensService) {
  app.openapi(
    createRoute({
      method: "post",
      operationId: "recordUsageBatch",
      path: "/usage/batch",
      summary: "Record a batch of usage counters (internal, called by Gateful)",
      description:
        "Additive upsert per (token, route, hour). Best-effort by design: " +
        "Gateful only retries batches whose POST failed outright, so rare " +
        "double counts are acceptable.",
      tags: ["internal"],
      request: {
        body: {
          content: { "application/json": { schema: UsageBatchBodySchema } },
        },
      },
      responses: {
        200: {
          description: "Number of entries recorded",
          content: {
            "application/json": {
              schema: z.object({ recorded: z.number().int() }),
            },
          },
        },
      },
    }),
    async (c) => {
      const { entries } = c.req.valid("json");
      await service.recordUsage(
        entries.map((e) => ({
          tokenId: e.tokenId,
          route: e.route,
          hour: truncateToHour(new Date(e.hour)),
          count: BigInt(e.count),
        })),
      );
      return c.json({ recorded: entries.length }, 200);
    },
  );
}

/** Defensive: the primary key is per-hour, so normalize even if Gateful already truncates. */
function truncateToHour(date: Date): Date {
  const truncated = new Date(date);
  truncated.setUTCMinutes(0, 0, 0);
  return truncated;
}
