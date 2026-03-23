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
  alreadySupportCalldataReview: z.boolean(),
  supportOffchainData: z.boolean(),
});

const DaosResponseSchema = z.object({
  items: z.array(DaoResponseSchema),
  totalCount: z.number(),
});

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
export type DaosResponse = z.infer<typeof DaosResponseSchema>;

const route = createRoute({
  method: "get",
  path: "/daos",
  responses: {
    200: {
      content: { "application/json": { schema: DaosResponseSchema } },
      description: "List of all configured DAOs",
    },
  },
});

export function daos(app: OpenAPIHono, service: DaosService) {
  app.openapi(route, async (c) => {
    const result = await service.getAllDaos();
    return c.json(result);
  });
}
