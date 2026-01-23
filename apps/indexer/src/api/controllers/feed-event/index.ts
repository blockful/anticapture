import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { FeedEventService } from "@/api/services";
import {
  FeedEventRequestQuerySchema,
  FeedEventListResponseSchema,
} from "@/api/mappers";

export function feedEvents(app: Hono, service: FeedEventService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getFeedEvents",
      path: "/feed",
      summary: "Get activity feed events",
      description:
        "Get governance activity events (votes, proposals, transfers, delegations) with filtering and pagination",
      tags: ["feed"],
      request: {
        query: FeedEventRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Returns activity feed events",
          content: {
            "application/json": {
              schema: FeedEventListResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        limit,
        offset,
        sortOrder,
        fromTimestamp,
        toTimestamp,
        types,
        relevances,
      } = context.req.valid("query");

      const result = await service.getFeedEvents({
        limit,
        offset,
        sortOrder,
        fromTimestamp,
        toTimestamp,
        types,
        relevances,
      });

      return context.json(result);
    },
  );
}
