import { z } from "@hono/zod-openapi";

import { feedEvent } from "@/database";

import {
  FeedEventTypeSchema,
  FeedRelevanceSchema,
  OrderDirectionSchema,
} from "../shared";

export type DBFeedEvent = typeof feedEvent.$inferSelect;

export const FeedRequestSchema = z
  .object({
    skip: z.coerce.number().int().optional().default(0),
    limit: z.coerce.number().int().optional().default(10),
    orderBy: z.enum(["timestamp", "value"]).optional().default("timestamp"),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    relevance: FeedRelevanceSchema.optional(),
    type: FeedEventTypeSchema.optional(),
    fromDate: z.coerce.number().int().optional(),
    toDate: z.coerce.number().int().optional(),
  })
  .openapi("FeedRequest", {
    description: "Query params used to page and filter feed events.",
  });

export const FeedItemSchema = z
  .object({
    txHash: z.string(),
    logIndex: z.number().int(),
    type: FeedEventTypeSchema,
    value: z.string().optional(),
    timestamp: z.number().int(),
    relevance: FeedRelevanceSchema,
    metadata: z.record(z.string(), z.any()).nullable().openapi("FeedMetadata"),
  })
  .openapi("FeedItem", {
    description: "Single event in the governance activity feed.",
  });

export const FeedResponseSchema = z
  .object({
    items: z.array(FeedItemSchema),
    totalCount: z.number().int(),
  })
  .openapi("FeedResponse", {
    description: "Paginated governance activity feed response.",
  });

export type FeedRequest = z.infer<typeof FeedRequestSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
