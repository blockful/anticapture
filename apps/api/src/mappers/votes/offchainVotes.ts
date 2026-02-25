import { z } from "@hono/zod-openapi";

import { offchainVotes } from "@/database";

export type DBOffchainVote = typeof offchainVotes.$inferSelect;

export const OffchainVotesRequestSchema = z.object({
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  limit: z.coerce
    .number()
    .max(1000, "Limit cannot exceed 1000")
    .optional()
    .default(10),
  orderBy: z.enum(["created", "vp"]).optional().default("created"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  voterAddresses: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return typeof val === "string" ? [val] : val;
    }),
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
});

export type OffchainVotesRequest = z.infer<typeof OffchainVotesRequestSchema>;

export const OffchainVoteResponseSchema = z.object({
  voter: z.string(),
  proposalId: z.string(),
  choice: z.unknown(),
  vp: z.number(),
  reason: z.string(),
  created: z.number(),
  proposalTitle: z.string(),
});

export type OffchainVoteResponse = z.infer<typeof OffchainVoteResponseSchema>;

export const OffchainVoteMapper = {
  toApi: (v: DBOffchainVote, proposalTitle: string): OffchainVoteResponse => ({
    voter: v.voter,
    proposalId: v.proposalId,
    choice: v.choice,
    vp: v.vp,
    reason: v.reason,
    created: v.created,
    proposalTitle,
  }),
};
