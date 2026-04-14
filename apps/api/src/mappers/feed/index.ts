import { z } from "@hono/zod-openapi";

import { feedEvent } from "@/database";
import { FeedEventType, FeedRelevance } from "@/lib/constants";

import {
  FeedRelevanceSchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";

export type DBFeedEvent = typeof feedEvent.$inferSelect;

export const VoteFeedMetadataSchema = z
  .object({
    voter: z.string(),
    reason: z.string().nullable(),
    support: z.number().int(),
    votingPower: z.string(),
    proposalId: z.string(),
    title: z.string().nullable(),
  })
  .openapi("VoteFeedMetadata");

export const DelegationFeedMetadataSchema = z
  .object({
    delegator: z.string(),
    delegate: z.string(),
    previousDelegate: z.string().nullable(),
    amount: z.string(),
  })
  .openapi("DelegationFeedMetadata");

export const TransferFeedMetadataSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    amount: z.string(),
  })
  .openapi("TransferFeedMetadata");

export const ProposalFeedMetadataSchema = z
  .object({
    id: z.string(),
    proposer: z.string(),
    votingPower: z.string(),
    title: z.string(),
  })
  .openapi("ProposalFeedMetadata");

export const ProposalExtendedFeedMetadataSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    endBlock: z.number().int(),
    endTimestamp: z.string(),
    proposer: z.string(),
  })
  .openapi("ProposalExtendedFeedMetadata");

export const FeedItemMetadataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(FeedEventType.VOTE),
    metadata: VoteFeedMetadataSchema,
  }),
  z.object({
    type: z.literal(FeedEventType.DELEGATION),
    metadata: DelegationFeedMetadataSchema,
  }),
  z.object({
    type: z.literal(FeedEventType.TRANSFER),
    metadata: TransferFeedMetadataSchema,
  }),
  z.object({
    type: z.literal(FeedEventType.PROPOSAL),
    metadata: ProposalFeedMetadataSchema,
  }),
  z.object({
    type: z.literal(FeedEventType.PROPOSAL_EXTENDED),
    metadata: ProposalExtendedFeedMetadataSchema,
  }),
]);

export type FeedItemMetadataByType = z.infer<typeof FeedItemMetadataSchema>;
export type FeedItemMetadata = FeedItemMetadataByType["metadata"];

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
    relevance: z.enum(FeedRelevance).optional().openapi({
      description: "Filter events by relevance tier.",
    }),
    type: z.enum(FeedEventType).optional().openapi({
      description: "Filter events by governance activity type.",
    }),
    fromDate: unixTimestampQueryParam(
      "Earliest event timestamp, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam("Latest event timestamp, in Unix seconds."),
  })
  .openapi("FeedRequest", {
    description: "Query params used to page and filter feed events.",
  });

const FeedItemBaseSchema = z.object({
  txHash: z.string().openapi({ description: "Transaction hash." }),
  logIndex: z.number().int().openapi({
    description: "Log index within the transaction receipt.",
  }),
  value: z.string().optional().openapi({
    description:
      "Optional event value encoded as a decimal string when applicable.",
  }),
  timestamp: z.number().int().openapi({
    description: "Event timestamp in Unix seconds.",
    example: 1704067200,
  }),
  relevance: FeedRelevanceSchema,
});

export const FeedItemSchema = z
  .discriminatedUnion("type", [
    FeedItemBaseSchema.extend({
      type: z.literal(FeedEventType.VOTE),
      metadata: VoteFeedMetadataSchema,
    }),
    FeedItemBaseSchema.extend({
      type: z.literal(FeedEventType.DELEGATION),
      metadata: DelegationFeedMetadataSchema,
    }),
    FeedItemBaseSchema.extend({
      type: z.literal(FeedEventType.TRANSFER),
      metadata: TransferFeedMetadataSchema,
    }),
    FeedItemBaseSchema.extend({
      type: z.literal(FeedEventType.PROPOSAL),
      metadata: ProposalFeedMetadataSchema,
    }),
    FeedItemBaseSchema.extend({
      type: z.literal(FeedEventType.PROPOSAL_EXTENDED),
      metadata: ProposalExtendedFeedMetadataSchema,
    }),
  ])
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
