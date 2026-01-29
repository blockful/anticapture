import { z } from "@hono/zod-openapi";
import { votesOnchain } from "ponder:schema";

type DBVote = typeof votesOnchain.$inferSelect;

export const VotesRequestQuerySchema = z.object({
  limit: z.coerce.number().optional().default(10),
  skip: z.coerce.number().optional().default(0),
  orderBy: z.enum(["timestamp", "votingPower"]).optional().default("timestamp"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
});

export type VotesRequest = z.infer<typeof VotesRequestQuerySchema>;

export const VoteResponseSchema = z.object({
  voterAddress: z.string(),
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

export function parseVoteToResponse(vote: DBVote): VoteResponse {
  return VoteResponseSchema.parse({
    voterAddress: vote.voterAccountId,
    transactionHash: vote.txHash,
    proposalId: vote.proposalId,
    support: Number(vote.support),
    votingPower: vote.votingPower.toString(),
    reason: vote.reason || null,
    timestamp: Number(vote.timestamp),
  });
}
