import { z } from "@hono/zod-openapi";
import {
  FeedEventTypeEnum,
  FeedEventRelevanceEnum,
  feedEventTypeValues,
  feedEventRelevanceValues,
} from "@/lib/enums";

// Feed Event Types - use values from the shared enum
export const FeedEventTypeSchema = z.enum(feedEventTypeValues);
export type FeedEventType = z.infer<typeof FeedEventTypeSchema>;

export const FeedEventRelevanceSchema = z.enum(feedEventRelevanceValues);
export type FeedEventRelevance = z.infer<typeof FeedEventRelevanceSchema>;

// Re-export enums for convenience
export { FeedEventTypeEnum, FeedEventRelevanceEnum };

// Request schemas
export const FeedEventRequestQuerySchema = z.object({
  limit: z.coerce.number().optional().default(20),
  offset: z.coerce.number().optional().default(0),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  fromTimestamp: z.coerce.number().optional(),
  toTimestamp: z.coerce.number().optional(),
  types: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .pipe(z.array(FeedEventTypeSchema))
    .optional(),
  relevances: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .pipe(z.array(FeedEventRelevanceSchema))
    .optional(),
});

export type FeedEventRequest = z.infer<typeof FeedEventRequestQuerySchema>;

// Response schemas for type-specific data
export const VoteDetailSchema = z.object({
  voter: z.string(),
  votingPower: z.string(),
  proposalId: z.string(),
  proposalTitle: z.string(),
  support: z.enum(["for", "against", "abstain"]),
});

export const ProposalDetailSchema = z.object({
  proposer: z.string(),
  proposalId: z.string(),
  proposalTitle: z.string(),
  votingPower: z.string(),
});

export const TransferDetailSchema = z.object({
  from: z.string(),
  to: z.string(),
  amount: z.string(),
});

export const DelegationDetailSchema = z.object({
  delegator: z.string(),
  delegate: z.string(),
  previousDelegate: z.string().nullable(),
  amount: z.string(),
});

// Main feed event response schema
export const FeedEventResponseSchema = z.object({
  txHash: z.string(),
  logIndex: z.number(),
  timestamp: z.string(),
  relevance: FeedEventRelevanceSchema,
  type: FeedEventTypeSchema,
  vote: VoteDetailSchema.optional(),
  proposal: ProposalDetailSchema.optional(),
  transfer: TransferDetailSchema.optional(),
  delegation: DelegationDetailSchema.optional(),
});

export type FeedEventResponse = z.infer<typeof FeedEventResponseSchema>;

export const FeedEventListResponseSchema = z.object({
  items: z.array(FeedEventResponseSchema),
  totalCount: z.number(),
});

export type FeedEventListResponse = z.infer<typeof FeedEventListResponseSchema>;

// Types for DB results with joined data
export interface DBFeedEventWithVote {
  txHash: string;
  logIndex: number;
  daoId: string;
  type: FeedEventTypeEnum.VOTE;
  relevance: FeedEventRelevance;
  timestamp: bigint;
  voterAccountId: string;
  votingPower: bigint;
  proposalId: string;
  support: string;
  proposalDescription: string;
}

export interface DBFeedEventWithProposal {
  txHash: string;
  logIndex: number;
  daoId: string;
  type: FeedEventTypeEnum.PROPOSAL;
  relevance: FeedEventRelevance;
  timestamp: bigint;
  proposerAccountId: string;
  proposalId: string;
  description: string;
  proposerVotingPower: bigint;
}

export interface DBFeedEventWithTransfer {
  txHash: string;
  logIndex: number;
  daoId: string;
  type: FeedEventTypeEnum.TRANSFER;
  relevance: FeedEventRelevance;
  timestamp: bigint;
  fromAccountId: string;
  toAccountId: string;
  amount: bigint;
}

export interface DBFeedEventWithDelegation {
  txHash: string;
  logIndex: number;
  daoId: string;
  type: FeedEventTypeEnum.DELEGATION;
  relevance: FeedEventRelevance;
  timestamp: bigint;
  delegatorAccountId: string;
  delegateAccountId: string;
  previousDelegate: string | null;
  delegatedValue: bigint;
}

export type DBFeedEvent =
  | DBFeedEventWithVote
  | DBFeedEventWithProposal
  | DBFeedEventWithTransfer
  | DBFeedEventWithDelegation;

// Helper to get support label
function getSupportLabel(support: string): "for" | "against" | "abstain" {
  switch (support) {
    case "0":
      return "against";
    case "1":
      return "for";
    case "2":
      return "abstain";
    default:
      return "abstain";
  }
}

// Helper to extract proposal title from description
function extractProposalTitle(description: string): string {
  // The title is typically the first line or up to the first newline
  const firstLine = (description.split("\n")[0] ?? "").trim();
  // Truncate if too long
  if (firstLine.length > 100) {
    return firstLine.substring(0, 97) + "...";
  }
  return firstLine || "Untitled Proposal";
}

// Mapper to convert DB results to API response
export const FeedEventMapper = {
  toApi: (event: DBFeedEvent): FeedEventResponse => {
    const base = {
      txHash: event.txHash,
      logIndex: event.logIndex,
      timestamp: event.timestamp.toString(),
      relevance: event.relevance,
      type: event.type,
    };

    switch (event.type) {
      case FeedEventTypeEnum.VOTE:
        return {
          ...base,
          vote: {
            voter: event.voterAccountId,
            votingPower: event.votingPower.toString(),
            proposalId: event.proposalId,
            proposalTitle: extractProposalTitle(event.proposalDescription),
            support: getSupportLabel(event.support),
          },
        };

      case FeedEventTypeEnum.PROPOSAL:
        return {
          ...base,
          proposal: {
            proposer: event.proposerAccountId,
            proposalId: event.proposalId,
            proposalTitle: extractProposalTitle(event.description),
            votingPower: event.proposerVotingPower.toString(),
          },
        };

      case FeedEventTypeEnum.TRANSFER:
        return {
          ...base,
          transfer: {
            from: event.fromAccountId,
            to: event.toAccountId,
            amount: event.amount.toString(),
          },
        };

      case FeedEventTypeEnum.DELEGATION:
        return {
          ...base,
          delegation: {
            delegator: event.delegatorAccountId,
            delegate: event.delegateAccountId,
            previousDelegate: event.previousDelegate,
            amount: event.delegatedValue.toString(),
          },
        };
    }
  },
};
