import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import type { DelegationService } from "./service.js";

const QuerySchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d+$/)
      .openapi({ description: "Start date (Unix timestamp)" }),
    endDate: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .openapi({ description: "End date (Unix timestamp)" }),
    after: z.string().optional(),
    before: z.string().optional(),
    orderDirection: z.string().optional(),
    limit: z.string().optional(),
  })
  .refine(
    (data) => !data.endDate || BigInt(data.startDate) < BigInt(data.endDate),
    { message: "startDate must be before endDate" },
  );

const DelegationItemSchema = z.object({
  date: z.string(),
  high: z.string(),
});

const ResponseSchema = z.object({
  items: z.array(DelegationItemSchema),
  totalCount: z.number(),
  pageInfo: z.object({
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    endDate: z.string().nullable(),
    startDate: z.string().nullable(),
  }),
});

const route = createRoute({
  method: "get",
  path: "/aggregations/average-delegation-percentage",
  request: { query: QuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: ResponseSchema } },
      description: "Average delegation percentage across all DAOs",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Validation error",
    },
  },
});

export function averageDelegation(
  app: OpenAPIHono,
  service: DelegationService,
) {
  app.openapi(route, async (c) => {
    const { startDate, endDate, after, before, orderDirection, limit } =
      c.req.valid("query");

    const result = await service.getAverageDelegationPercentage({
      startDate,
      endDate,
      after,
      before,
      orderDirection,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return c.json(result, 200);
  });
}
