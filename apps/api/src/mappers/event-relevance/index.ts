import { z } from "@hono/zod-openapi";

import { FeedEventTypeSchema, FeedRelevanceSchema } from "../shared";

export const EventRelevanceThresholdQuerySchema = z
  .object({
    type: FeedEventTypeSchema,
    relevance: FeedRelevanceSchema,
  })
  .openapi("EventRelevanceThresholdQuery", {
    description:
      "Query params required to resolve an event relevance threshold.",
  });

export const EventRelevanceThresholdResponseSchema = z
  .object({
    threshold: z.string().openapi({
      description: "Threshold value encoded as a decimal string.",
      example: "1000000000000000000",
    }),
  })
  .openapi("EventRelevanceThresholdResponse", {
    description:
      "Resolved threshold for a feed event type and relevance level.",
  });
