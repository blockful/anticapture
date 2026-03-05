import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { EventRelevanceService } from "@/services";

export function eventRelevance(app: Hono, service: EventRelevanceService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getEventRelevanceThreshold",
      path: "/event-relevance/threshold",
      summary: "Get event relevance threshold",
      tags: ["event-relevance"],
      request: {
        query: z.object({
          type: z.nativeEnum(FeedEventType),
          relevance: z.nativeEnum(FeedRelevance),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved threshold",
          content: {
            "application/json": {
              schema: z.object({
                threshold: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { type, relevance } = context.req.valid("query");
      const threshold = service.getThreshold(type, relevance);
      return context.json({ threshold });
    },
  );
}
