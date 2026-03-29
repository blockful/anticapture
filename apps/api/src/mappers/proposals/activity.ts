import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { VoteFilter } from "@/repositories/";
import {
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
  VoteSupportSchema,
} from "../shared";

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
    fromDate: unixTimestampQueryParam(
      "Lower bound for proposal timestamps, in Unix seconds.",
    ),
    skip: paginationSkipQueryParam(
      "Number of proposal activity records to skip.",
    ),
    limit: paginationLimitQueryParam(
      "Maximum number of proposal activity records to return.",
    ),
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
    id: z.string().openapi({ description: "Onchain proposal identifier." }),
    daoId: z.string().openapi({ description: "DAO identifier." }),
    proposerAccountId: z
      .string()
      .openapi({ description: "Address that created the proposal." }),
    title: z.string().openapi({ description: "Proposal title." }),
    description: z.string().openapi({ description: "Proposal body." }),
    startBlock: z.number().openapi({ description: "Start block number." }),
    endBlock: z.number().openapi({ description: "End block number." }),
    timestamp: z.coerce.string().openapi({
      description: "Proposal creation timestamp in Unix seconds as a string.",
      example: "1704067200",
    }),
    status: z.string().openapi({ description: "Current proposal status." }),
    forVotes: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({
        type: "string",
        description: "Votes cast in favor, encoded as a decimal string.",
      }),
    againstVotes: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({
        type: "string",
        description: "Votes cast against, encoded as a decimal string.",
      }),
    abstainVotes: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({
        type: "string",
        description: "Abstain votes, encoded as a decimal string.",
      }),
  })
  .openapi("ProposalActivityProposal", {
    description:
      "Proposal snapshot included in the delegate activity response.",
  });

export const ProposalActivityUserVoteSchema = z
  .object({
    id: z.string().openapi({ description: "Vote identifier." }),
    voterAccountId: z
      .string()
      .openapi({ description: "Address that cast the vote." }),
    proposalId: z.string().openapi({ description: "Related proposal ID." }),
    support: VoteSupportSchema,
    votingPower: z.coerce.string().openapi({
      type: "string",
      description: "Voting power used by the delegate, encoded as a string.",
    }),
    reason: z.string().nullable().openapi({
      description: "Optional vote rationale.",
    }),
    timestamp: z.coerce.string().openapi({
      description: "Vote timestamp in Unix seconds as a string.",
      example: "1704067200",
    }),
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
    address: z.string().openapi({ description: "Delegate address." }),
    totalProposals: z
      .number()
      .int()
      .openapi({ description: "Total proposals reviewed in the dataset." }),
    votedProposals: z
      .number()
      .int()
      .openapi({ description: "Number of proposals the delegate voted on." }),
    neverVoted: z
      .boolean()
      .openapi({ description: "Whether the delegate never cast a vote." }),
    winRate: z.number().openapi({
      description: "Share of proposals where the delegate sided with outcome.",
    }),
    yesRate: z.number().openapi({
      description: "Share of delegate votes cast in support.",
    }),
    avgTimeBeforeEnd: z.number().openapi({
      description:
        "Average seconds between the delegate vote and proposal end time.",
    }),
    proposals: z.array(ProposalActivityItemSchema),
  })
  .openapi("ProposalActivityResponse", {
    description:
      "Delegate proposal activity metrics and proposal-by-proposal history.",
  });
