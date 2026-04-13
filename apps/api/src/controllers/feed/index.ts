import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { FeedRequestSchema, FeedResponseSchema } from "@/mappers";
import { setCacheControl } from "@/middlewares";
import { FeedService } from "@/services";

export function feed(app: Hono, service: FeedService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "feedEvents",
      path: "/feed/events",
      summary: "Get feed events",
      tags: ["feed"],
      middleware: [setCacheControl(60)],
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
      return context.json(FeedResponseSchema.parse(response), 200);
    },
  );
}
