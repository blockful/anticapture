import { z } from "@hono/zod-openapi";

import { FeedEventType, FeedRelevance } from "@/lib/constants";

export const EventRelevanceThresholdQuerySchema = z
  .object({
    type: z.nativeEnum(FeedEventType).openapi({
      description: "Feed event type whose threshold is being queried.",
      example: FeedEventType.TRANSFER,
    }),
    relevance: z.nativeEnum(FeedRelevance).openapi({
      description: "Relevance bucket to resolve for the given event type.",
      example: FeedRelevance.MEDIUM,
    }),
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
