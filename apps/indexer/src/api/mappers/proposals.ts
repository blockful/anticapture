import { z } from "@hono/zod-openapi";
import { proposalsOnchain } from "ponder:schema";

export type DBProposal = typeof proposalsOnchain.$inferSelect;

export const ProposalsRequestSchema = z.object({
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
  orderDirection: z.enum(["asc", "desc"]).default("desc").optional(),
});

export type ProposalsRequest = z.infer<typeof ProposalsRequestSchema>;

export const ProposalsResponseSchema = z.object({
  proposals: z.array(
    z.object({
      id: z.string(),
      daoId: z.string(),
      proposerAccountId: z.string(),
      description: z.string(),
      startBlock: z.number(),
      endBlock: z.number(),
      timestamp: z.string(),
      status: z.string(),
      forVotes: z.string(),
      againstVotes: z.string(),
      abstainVotes: z.string(),
      endTimestamp: z.string(),
    }),
  ),
});

export type ProposalsResponse = z.infer<typeof ProposalsResponseSchema>;

export const ProposalMapper = {
  toApi: (proposal: DBProposal[]): ProposalsResponse => {
    return {
      proposals: proposal.map((p) => ({
        id: p.id,
        daoId: p.daoId,
        proposerAccountId: p.proposerAccountId,
        description: p.description,
        startBlock: p.startBlock,
        endBlock: p.endBlock,
        timestamp: p.timestamp.toString(),
        status: p.status,
        forVotes: p.forVotes.toString(),
        againstVotes: p.againstVotes.toString(),
        abstainVotes: p.abstainVotes.toString(),
        endTimestamp: p.endTimestamp.toString(),
      })),
    };
  },
};
