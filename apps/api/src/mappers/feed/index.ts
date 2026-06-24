import { z } from "@hono/zod-openapi";

import { feedEvent } from "@/database";
import { FeedEventType, FeedRelevance } from "@/lib/constants";

import {
  FeedEventTypeSchema,
  FeedRelevanceSchema,
  normalizeQueryArray,
  defaultDescOrderDirection,
  earliestLatestDateRangeQueryParams,
  logIndexField,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  txHashField,
} from "../shared";

export type DBFeedEvent = typeof feedEvent.$inferSelect;

const FeedEventTypeValues = Object.values(FeedEventType) as [
  FeedEventType,
  ...FeedEventType[],
];

const FeedEventTypeListSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => {
    const types = normalizeQueryArray(value);
    return types
      ? z
          .array(z.enum(FeedEventTypeValues))
          .parse(types.map((type) => String(type).toUpperCase()))
      : undefined;
  });

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
    orderDirection: defaultDescOrderDirection(),
    relevance: z.enum(FeedRelevance).optional().openapi({
      description: "Filter events by relevance tier.",
    }),
    type: FeedEventTypeListSchema.optional().openapi("FeedEventTypeList", {
      type: "array",
      items: {
        type: "string",
        enum: FeedEventTypeValues,
      },
      description:
        "Filter events by governance activity type. Pass repeated query params or a comma-delimited list.",
      example: ["VOTE"],
    }),
    ...earliestLatestDateRangeQueryParams("event"),
  })
  .openapi("FeedRequest", {
    description: "Query params used to page and filter feed events.",
  });

export const FeedVoteMetadataSchema = z
  .object({
    kind: z.literal(FeedEventType.VOTE).openapi({
      description: "Discriminator identifying the metadata variant.",
    }),
    voter: z.string().openapi({ description: "Voter address." }),
    reason: z
      .string()
      .nullable()
      .openapi({ description: "Vote reason, when provided." }),
    support: z.number().int().openapi({
      description: "Vote support: 0 = against, 1 = for, 2 = abstain.",
    }),
    votingPower: z.string().openapi({
      description: "Voter voting power, as a decimal string.",
      format: "int64",
    }),
    proposalId: z.string().openapi({ description: "Proposal voted on." }),
    title: z
      .string()
      .optional()
      .openapi({ description: "Proposal title, when known." }),
  })
  .openapi("FeedVoteMetadata", {
    description: "Metadata payload for a VOTE feed event.",
  });

export const FeedProposalMetadataSchema = z
  .object({
    kind: z.literal(FeedEventType.PROPOSAL).openapi({
      description: "Discriminator identifying the metadata variant.",
    }),
    id: z.string().openapi({ description: "Proposal ID." }),
    proposer: z.string().openapi({ description: "Proposer address." }),
    votingPower: z.string().openapi({
      description:
        "Proposer voting power at proposal creation, as a decimal string.",
      format: "int64",
    }),
    title: z.string().openapi({ description: "Proposal title." }),
  })
  .openapi("FeedProposalMetadata", {
    description: "Metadata payload for a PROPOSAL feed event.",
  });

export const FeedProposalExtendedMetadataSchema = z
  .object({
    kind: z.literal(FeedEventType.PROPOSAL_EXTENDED).openapi({
      description: "Discriminator identifying the metadata variant.",
    }),
    id: z.string().openapi({ description: "Proposal ID." }),
    title: z.string().openapi({ description: "Proposal title." }),
    endBlock: z.number().int().openapi({
      description: "New end block after the extension.",
    }),
    endTimestamp: z.string().openapi({
      description:
        "New proposal end timestamp in Unix seconds, as a decimal string.",
      format: "int64",
    }),
    proposer: z.string().openapi({ description: "Proposer address." }),
  })
  .openapi("FeedProposalExtendedMetadata", {
    description: "Metadata payload for a PROPOSAL_EXTENDED feed event.",
  });

export const FeedTransferMetadataSchema = z
  .object({
    kind: z.literal(FeedEventType.TRANSFER).openapi({
      description: "Discriminator identifying the metadata variant.",
    }),
    from: z.string().openapi({ description: "Sender address." }),
    to: z.string().openapi({ description: "Recipient address." }),
    amount: z.string().openapi({
      description: "Transferred amount, as a decimal string.",
      format: "int64",
    }),
  })
  .openapi("FeedTransferMetadata", {
    description: "Metadata payload for a TRANSFER feed event.",
  });

export const FeedDelegationMetadataSchema = z
  .object({
    kind: z.literal(FeedEventType.DELEGATION).openapi({
      description: "Discriminator identifying the metadata variant.",
    }),
    delegator: z.string().openapi({ description: "Delegator address." }),
    delegate: z.string().openapi({ description: "New delegate address." }),
    previousDelegate: z
      .string()
      .nullable()
      .openapi({ description: "Previous delegate address, when known." }),
    amount: z.string().openapi({
      description: "Delegated voting power, as a decimal string.",
      format: "int64",
    }),
  })
  .openapi("FeedDelegationMetadata", {
    description: "Metadata payload for a DELEGATION feed event.",
  });

export const FeedMetadataSchema = z
  .discriminatedUnion("kind", [
    FeedVoteMetadataSchema,
    FeedProposalMetadataSchema,
    FeedProposalExtendedMetadataSchema,
    FeedTransferMetadataSchema,
    FeedDelegationMetadataSchema,
  ])
  .openapi("FeedMetadata", {
    description:
      "Type-specific metadata for the feed event. Narrow by the `kind` discriminator.",
  });

export const FeedItemSchema = z
  .object({
    txHash: txHashField(),
    logIndex: logIndexField(),
    type: FeedEventTypeSchema,
    value: z.string().optional().openapi({
      description:
        "Optional event value encoded as a decimal string when applicable.",
      format: "int64",
    }),
    timestamp: z.number().int().openapi({
      description: "Event timestamp in Unix seconds.",
      example: 1704067200,
    }),
    relevance: FeedRelevanceSchema,
    metadata: FeedMetadataSchema.nullable(),
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
