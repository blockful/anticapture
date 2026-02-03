import { z } from "@hono/zod-openapi";

export const ProposalActivityResponseSchema = z.object({
  address: z.string(),
  totalProposals: z.number(),
  votedProposals: z.number(),
  neverVoted: z.boolean(),
  winRate: z.number(),
  yesRate: z.number(),
  avgTimeBeforeEnd: z.number(),
  proposals: z.array(
    z.object({
      proposal: z.object({
        id: z.string(),
        daoId: z.string(),
        proposerAccountId: z.string(),
        description: z.string().nullable(),
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
      }),
      userVote: z
        .object({
          id: z.string(),
          voterAccountId: z.string(),
          proposalId: z.string(),
          support: z.string().nullable(),
          votingPower: z.string(),
          reason: z.string().nullable(),
          timestamp: z.coerce.string(),
        })
        .nullable(),
    }),
  ),
});
