import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import type { DaosService } from "./service.js";

const DaosResponseSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())),
  totalCount: z.number(),
});

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
    return c.json(result as z.infer<typeof DaosResponseSchema>, 200);
  });
}
