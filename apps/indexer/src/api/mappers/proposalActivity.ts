import { z } from "zod";
import { isAddress } from "viem";

import { ProposalSchema } from "./proposals";
import { type ProposalWithVotes } from "../repositories/proposals-activity.repository";

export const ProposalActivityRequestSchema = z.object({
  address: z
    .string()
    .refine((addr) => isAddress(addr), "Invalid Ethereum address"),
  fromDate: z.coerce
    .number()
    .int()
    .positive("From date must be a positive timestamp")
    .optional(),
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .default(0)
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(100, "Limit cannot exceed 100")
    .default(10)
    .optional(),
});

export type ProposalActivityRequest = z.infer<
  typeof ProposalActivityRequestSchema
>;

export const VoteSchema = z.object({
  id: z.string(),
  voterAccountId: z.string(),
  support: z.string().nullable(),
  votingPower: z.string().default("0"),
  reason: z.string().nullable(),
  timestamp: z.string(),
});

export const ProposalWithVoteSchema = ProposalSchema.extend({
  vote: VoteSchema.optional(),
});

export const ProposalActivityResponseSchema = z.object({
  address: z.string(),
  totalProposals: z.number().optional().default(0),
  votedProposals: z.number().optional().default(0),
  neverVoted: z.boolean().optional().default(false),
  winRate: z.number().optional().default(0),
  yesRate: z.number().optional().default(0),
  avgTimeBeforeEnd: z.number().optional().default(0),
  proposals: z.array(ProposalWithVoteSchema),
});

export type ProposalActivityResponse = z.infer<
  typeof ProposalActivityResponseSchema
>;

export function ProposalActivityMapper() {
  return {
    toAPI: (proposal: ProposalWithVotes) => {
      return {
        ...proposal,
        vote: proposal.votes.length > 0 ? proposal.votes[0] : undefined,
      };
    },
  };
}
