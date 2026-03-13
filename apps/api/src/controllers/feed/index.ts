import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { FeedRequestSchema, FeedResponseSchema } from "@/mappers";
import { FeedService } from "@/services";

export function feed(app: Hono, service: FeedService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "feedEvents",
      path: "/feed/events",
      summary: "Get feed events",
      tags: ["feed"],
      request: {
        query: FeedRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved feed events",
          content: {
            "application/json": {
              schema: FeedResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const req = context.req.valid("query");
      const response = await service.getFeedEvents(req);
      return context.json(FeedResponseSchema.parse(response));
    },
  );
}
