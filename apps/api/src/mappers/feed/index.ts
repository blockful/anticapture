import { z } from "@hono/zod-openapi";

import { feedEvent } from "@/database";

import {
  FeedEventTypeSchema,
  FeedRelevanceSchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";

export type DBFeedEvent = typeof feedEvent.$inferSelect;

export const FeedRequestSchema = z
  .object({
    skip: paginationSkipQueryParam(
      "Number of feed events to skip before collecting results.",
    ),
    limit: paginationLimitQueryParam(
      "Maximum number of feed events to return.",
    ),
    orderBy: z
      .enum(["timestamp", "value"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Field used to sort feed events.",
        example: "timestamp",
      }),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    relevance: FeedRelevanceSchema.optional(),
    type: FeedEventTypeSchema.optional(),
    fromDate: unixTimestampQueryParam(
      "Earliest event timestamp, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam("Latest event timestamp, in Unix seconds."),
  })
  .openapi("FeedRequest", {
    description: "Query params used to page and filter feed events.",
  });

export const FeedItemSchema = z
  .object({
    txHash: z.string().openapi({ description: "Transaction hash." }),
    logIndex: z.number().int().openapi({
      description: "Log index within the transaction receipt.",
    }),
    type: FeedEventTypeSchema,
    value: z.string().optional().openapi({
      description:
        "Optional event value encoded as a decimal string when applicable.",
    }),
    timestamp: z.number().int().openapi({
      description: "Event timestamp in Unix seconds.",
      example: 1704067200,
    }),
    relevance: FeedRelevanceSchema,
    metadata: z.record(z.string(), z.any()).nullable().openapi("FeedMetadata", {
      description: "Type-specific metadata for the feed event.",
    }),
  })
  .openapi("FeedItem", {
    description: "Single event in the governance activity feed.",
  });

export const FeedResponseSchema = z
  .object({
    items: z.array(FeedItemSchema),
    totalCount: z.number().int().openapi({
      description: "Total number of matching feed events.",
      example: 128,
    }),
  })
  .openapi("FeedResponse", {
    description: "Paginated governance activity feed response.",
  });

export type FeedRequest = z.infer<typeof FeedRequestSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
