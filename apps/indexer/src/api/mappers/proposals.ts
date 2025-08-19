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
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      // Always normalize to array and uppercase
      const normalized = typeof val === "string" ? [val] : val;
      return normalized.map((v) => v.toUpperCase());
    }),
  fromDate: z.number().optional(),
});

export type ProposalsRequest = z.infer<typeof ProposalsRequestSchema>;

export const ProposalResponseSchema = z.object({
  id: z.string(),
  daoId: z.string(),
  txHash: z.string(),
  proposerAccountId: z.string(),
  title: z.string().optional(),
  description: z.string(),
  startBlock: z.number(),
  endBlock: z.number(),
  timestamp: z.string(),
  status: z.string(),
  forVotes: z.string(),
  againstVotes: z.string(),
  abstainVotes: z.string(),
  endTimestamp: z.string(),
});

export const ProposalsResponseSchema = z.array(ProposalResponseSchema);

export type ProposalsResponse = z.infer<typeof ProposalsResponseSchema>;

export const ProposalRequestSchema = z.object({
  id: z.string(),
});

export type ProposalParams = z.infer<typeof ProposalRequestSchema>;

export type ProposalResponse = z.infer<typeof ProposalResponseSchema>;

export const ProposalMapper = {
  toApi: (p: DBProposal): ProposalResponse => {
    return {
      id: p.id,
      daoId: p.daoId,
      txHash: p.txHash,
      proposerAccountId: p.proposerAccountId,
      title: p.description.split("\n")[0]?.replace(/^#+\s*/, ""),
      description: p.description,
      startBlock: p.startBlock,
      endBlock: p.endBlock,
      timestamp: p.timestamp.toString(),
      status: p.status,
      forVotes: p.forVotes.toString(),
      againstVotes: p.againstVotes.toString(),
      abstainVotes: p.abstainVotes.toString(),
      endTimestamp: p.endTimestamp.toString(),
    };
  },
};
