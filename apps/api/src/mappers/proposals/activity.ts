import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { VoteFilter } from "@/repositories/";
import { OrderDirectionSchema, VoteSupportSchema } from "../shared";

export const ProposalActivityRequestSchema = z
  .object({
    address: z
      .string()
      .refine(
        (addr) => isAddress(addr, { strict: false }),
        "Invalid Ethereum address",
      )
      .transform((addr) => getAddress(addr))
      .openapi({
        description:
          "Delegate address whose proposal activity is being queried.",
        example: "0x1111111111111111111111111111111111111111",
      }),
    fromDate: z
      .string()
      .transform((val) => Number(val))
      .optional()
      .openapi({
        description: "Lower bound for proposal timestamps, in Unix seconds.",
        example: "1704067200",
      }),
    skip: z.coerce.number().int().min(0).optional().default(0).openapi({
      description: "Number of proposal activity records to skip.",
      example: 0,
    }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .openapi({
        description: "Maximum number of proposal activity records to return.",
        example: 10,
      }),
    orderBy: z
      .enum(["timestamp", "votingPower", "voteTiming"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Field used to sort proposal activity results.",
        example: "timestamp",
      }),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    userVoteFilter: z.nativeEnum(VoteFilter).optional().openapi({
      description:
        "Optional vote filter. Use yes, no, abstain, or no-vote to narrow the result set.",
      example: VoteFilter.YES,
    }),
  })
  .openapi("ProposalActivityRequest", {
    description: "Query params for delegate proposal activity.",
  });

export const ProposalActivityProposalSchema = z
  .object({
    id: z.string(),
    daoId: z.string(),
    proposerAccountId: z.string(),
    title: z.string(),
    description: z.string(),
    startBlock: z.number(),
    endBlock: z.number(),
    timestamp: z.coerce.string(),
    status: z.string(),
    forVotes: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({ type: "string" }),
    againstVotes: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({ type: "string" }),
    abstainVotes: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({ type: "string" }),
  })
  .openapi("ProposalActivityProposal", {
    description:
      "Proposal snapshot included in the delegate activity response.",
  });

export const ProposalActivityUserVoteSchema = z
  .object({
    id: z.string(),
    voterAccountId: z.string(),
    proposalId: z.string(),
    support: VoteSupportSchema.nullable(),
    votingPower: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({ type: "string" }),
    reason: z.string().nullable(),
    timestamp: z.coerce.string(),
  })
  .openapi("ProposalActivityUserVote", {
    description: "Vote cast by the requested delegate for a given proposal.",
  });

export const ProposalActivityItemSchema = z
  .object({
    proposal: ProposalActivityProposalSchema,
    userVote: ProposalActivityUserVoteSchema.nullable(),
  })
  .openapi("ProposalActivityItem", {
    description:
      "Combined proposal and delegate vote context for one activity row.",
  });

export const ProposalActivityResponseSchema = z
  .object({
    address: z.string(),
    totalProposals: z.number().int(),
    votedProposals: z.number().int(),
    neverVoted: z.boolean(),
    winRate: z.number(),
    yesRate: z.number(),
    avgTimeBeforeEnd: z.number(),
    proposals: z.array(ProposalActivityItemSchema),
  })
  .openapi("ProposalActivityResponse", {
    description:
      "Delegate proposal activity metrics and proposal-by-proposal history.",
  });
