import { z } from "@hono/zod-openapi";

import { feedEvent } from "@/database";
import { FeedEventType, FeedRelevance } from "@/lib/constants";

export type DBFeedEvent = typeof feedEvent.$inferSelect;

export const FeedRequestSchema = z
  .object({
    skip: z.coerce.number().int().optional().default(0),
    limit: z.coerce.number().int().optional().default(10),
    orderBy: z.enum(["timestamp", "value"]).optional().default("timestamp"),
    orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
    relevance: z
      .nativeEnum(FeedRelevance)
      .optional()
      .default(FeedRelevance.MEDIUM),
    type: z.nativeEnum(FeedEventType).optional(),
    fromDate: z.coerce.number().int().optional(),
    toDate: z.coerce.number().int().optional(),
  })
  .openapi("FeedRequest");

export const FeedItemSchema = z
  .object({
    txHash: z.string(),
    logIndex: z.number().int(),
    type: z.nativeEnum(FeedEventType),
    value: z.string().optional(),
    timestamp: z.number().int(),
    relevance: z.nativeEnum(FeedRelevance),
    metadata: z.record(z.string(), z.any()).nullable().openapi("FeedMetadata"),
  })
  .openapi("FeedItem");

export const FeedResponseSchema = z
  .object({
    items: z.array(FeedItemSchema),
    totalCount: z.number().int(),
  })
  .openapi("FeedResponse");

export type FeedRequest = z.infer<typeof FeedRequestSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
