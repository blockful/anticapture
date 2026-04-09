import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { FeedEventType, FeedRelevance } from "@/lib/constants";

import {
  EventRelevanceThresholdQuerySchema,
  EventRelevanceThresholdResponseSchema,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";
import { EventRelevanceService } from "@/services";

export function eventRelevance(app: Hono, service: EventRelevanceService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getEventRelevanceThreshold",
      path: "/event-relevance/threshold",
      summary: "Get event relevance threshold",
      tags: ["feed"],
      middleware: [setCacheControl(3600)],
      request: {
        query: EventRelevanceThresholdQuerySchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved threshold",
          content: {
            "application/json": {
              schema: EventRelevanceThresholdResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { type, relevance } = context.req.valid("query");
      const threshold = service.getThreshold(
        type as FeedEventType,
        relevance as FeedRelevance,
      );
      return context.json({ threshold }, 200);
    },
  );
}
