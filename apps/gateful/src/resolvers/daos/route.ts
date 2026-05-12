import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import type { DaosService } from "./service";

const DaoResponseSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  quorum: z.string(),
  proposalThreshold: z.string(),
  votingDelay: z.string(),
  votingPeriod: z.string(),
  timelockDelay: z.string(),
  supportsCalldataReview: z.boolean(),
  supportsOffchainData: z.boolean(),
});

const DaosResponseSchema = z.object({
  items: z.array(DaoResponseSchema),
  totalCount: z.number(),
});

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
export type DaosResponse = z.infer<typeof DaosResponseSchema>;

const route = createRoute({
  method: "get",
  operationId: "daos",
  path: "/daos",
  summary: "List of all configured DAOs",
  tags: ["governance"],
  responses: {
    200: {
      content: { "application/json": { schema: DaosResponseSchema } },
      description: "List of all configured DAOs",
    },
  },
});

export function daos(app: OpenAPIHono, service: DaosService) {
  app.openapi(route, async (c) => {
    const { cacheControl, ...body } = await service.getAllDaos();
    if (cacheControl) c.header("Cache-Control", cacheControl);
    return c.json(body, 200);
  });
}
