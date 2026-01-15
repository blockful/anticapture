import { z } from "@hono/zod-openapi";
import { votesOnchain } from "ponder:schema";
import { isAddress } from "viem";

export type DBVote = typeof votesOnchain.$inferSelect;

export const VotesRequestSchema = z.object({
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(1000, "Limit cannot exceed 1000")
    .default(10)
    .optional(),
  account: z.string().refine((val) => isAddress(val)),
  sortBy: z.enum(["timestamp", "votingPower"]).default("timestamp").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  reason: z.coerce.number().int().optional(),
});

export type VotesRequest = z.infer<typeof VotesRequestSchema>;

export const VoteResponseSchema = z.object({
  voter: z.string(),
  transactionHash: z.string(),
  proposalId: z.string(),
  support: z.number(),
  votingPower: z.string(),
  reason: z.string().nullable(),
  timestamp: z.number(),
});

export type VoteResponse = z.infer<typeof VoteResponseSchema>;

export const VotesResponseSchema = z.object({
  items: z.array(VoteResponseSchema),
  totalCount: z.number(),
});

export type VotesResponse = z.infer<typeof VotesResponseSchema>;

export const VotesMapper = {
  toApi: (vote: DBVote): VoteResponse => {
    return {
      voter: vote.voterAccountId,
      transactionHash: vote.txHash,
      proposalId: vote.proposalId,
      support: Number(vote.support),
      votingPower: vote.votingPower.toString(),
      reason: vote.reason || null,
      timestamp: Number(vote.timestamp),
    };
  },
};
