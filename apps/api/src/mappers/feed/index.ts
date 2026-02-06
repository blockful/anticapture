import { z } from "@hono/zod-openapi";
import { feedEvent } from "@/database";
import { FeedEventType, FeedRelevance } from "@/lib/constants";

export type DBFeedEvent = typeof feedEvent.$inferSelect;

export const FeedRequestSchema = z.object({
  skip: z.number().optional().default(0),
  limit: z.number().optional().default(10),
  orderBy: z.enum(["timestamp", "value"]).optional().default("timestamp"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  relevance: z.nativeEnum(FeedRelevance).optional().default(FeedRelevance.ALL),
  type: z.nativeEnum(FeedEventType).optional(),
  fromDate: z.number().optional(),
  toDate: z.number().optional(),
});

export const FeedItemSchema = z.object({
  txHash: z.string(),
  logIndex: z.number(),
  type: z.string(),
  value: z.string(),
  timestamp: z.number(),
});

export const FeedResponseSchema = z.object({
  items: z.array(FeedItemSchema),
  totalCount: z.number(),
});

export type FeedRequest = z.infer<typeof FeedRequestSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
