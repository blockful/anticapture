import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import type { DelegationService } from "./service.js";

const QuerySchema = z
  .object({
    startDate: z.coerce
      .number()
      .transform(String)
      .openapi({ description: "Start date (Unix timestamp)" }),
    endDate: z.coerce
      .number()
      .transform(String)
      .optional()
      .openapi({ description: "End date (Unix timestamp)" }),
    orderDirection: z.enum(["asc", "desc"]).optional().default("asc"),
    skip: z.coerce.number().int().nonnegative().optional().default(0).openapi({
      description: "Number of day buckets to skip before returning results.",
    }),
    limit: z.coerce.number().optional().default(10),
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
  operationId: "averageDelegationPercentage",
  path: "/aggregations/average-delegation-percentage",
  summary: "Average delegation percentage across all DAOs",
  description:
    "Returns the delegated-supply percentage averaged across all configured DAOs, bucketed by day over the requested period.",
  tags: ["governance"],
  request: { query: QuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: ResponseSchema } },
      description: "Average delegation percentage across all DAOs",
    },
  },
});

export function averageDelegation(
  app: OpenAPIHono,
  service: DelegationService,
) {
  app.openapi(route, async (c) => {
    const { startDate, endDate, orderDirection, skip, limit } =
      c.req.valid("query");

    const result = await service.getAverageDelegationPercentage({
      startDate,
      endDate,
      orderDirection,
      skip,
      limit,
    });

    const { cacheControl, ...body } = result;
    if (cacheControl) c.header("Cache-Control", cacheControl);
    return c.json(body, 200);
  });
}
