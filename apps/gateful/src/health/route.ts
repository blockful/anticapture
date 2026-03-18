import { createRoute } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

const route = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      description: "Health check",
    },
  },
});

export function health(app: OpenAPIHono) {
  app.openapi(route, (c) => {
    return c.body(null, 200);
  });
}
