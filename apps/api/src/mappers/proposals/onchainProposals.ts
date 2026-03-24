import { z } from "@hono/zod-openapi";

import { proposalsOnchain } from "@/database";
import { normalizeQueryArray, unixTimestampQueryParam } from "../shared";

export type DBProposal = typeof proposalsOnchain.$inferSelect;

const StringArrayQuerySchema = z
  .array(z.string())
  .openapi("OnchainProposalStatusList");

export const ProposalsRequestSchema = z
  .object({
    skip: z.coerce
      .number()
      .int()
      .min(0, "Skip must be a non-negative integer")
      .optional()
      .default(0)
      .openapi({
        description: "Number of proposals to skip before collecting results.",
        example: 0,
      }),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be a positive integer")
      .max(1000, "Limit cannot exceed 1000")
      .optional()
      .default(10)
      .openapi({
        description: "Maximum number of proposals to return.",
        example: 10,
      }),
    orderDirection: z.enum(["asc", "desc"]).default("desc").optional().openapi({
      description: "Sort direction for proposal timestamps.",
      example: "desc",
    }),
    status: z
      .preprocess(normalizeQueryArray, StringArrayQuerySchema.optional())
      .transform((values) => values?.map((value) => value.toUpperCase()))
      .openapi({
        description:
          "Proposal status filter. Pass repeated query params or a comma-delimited list.",
        example: ["ACTIVE"],
      }),
    fromDate: unixTimestampQueryParam(
      "Earliest proposal timestamp, in Unix seconds.",
    ),
    fromEndDate: unixTimestampQueryParam(
      "Latest proposal end timestamp, in Unix seconds.",
      1700086400,
    ),
    includeOptimisticProposals: z
      .enum(["true", "false"])
      .optional()
      .default("true")
      .transform((val) => val === "true")
      .openapi({
        description: "Whether optimistic proposals should be included.",
        example: "false",
        type: "boolean",
      }),
  })
  .openapi("OnchainProposalsRequest");

export type ProposalsRequest = z.infer<typeof ProposalsRequestSchema>;

export const ProposalResponseSchema = z
  .object({
    id: z.string(),
    daoId: z.string(),
    txHash: z.string(),
    proposerAccountId: z.string(),
    title: z.string(),
    description: z.string(),
    startBlock: z.number().int(),
    endBlock: z.number().int(),
    timestamp: z.number().int(),
    status: z.string(),
    forVotes: z.string(),
    againstVotes: z.string(),
    abstainVotes: z.string(),
    startTimestamp: z.number().int(),
    endTimestamp: z.number().int(),
    quorum: z.string(),
    calldatas: z.array(z.string()),
    values: z.array(z.string()),
    targets: z.array(z.string()),
    proposalType: z.number().int().nullable(),
  })
  .openapi("OnchainProposal");

export const ProposalsResponseSchema = z
  .object({
    items: z.array(ProposalResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("OnchainProposalsResponse");

export type ProposalsResponse = z.infer<typeof ProposalsResponseSchema>;

export const ProposalRequestSchema = z
  .object({
    id: z.string().openapi({
      param: {
        description: "Onchain proposal identifier.",
        example: "proposal-1",
      },
    }),
  })
  .openapi("OnchainProposalParams");

export type ProposalParams = z.infer<typeof ProposalRequestSchema>;

export type ProposalResponse = z.infer<typeof ProposalResponseSchema>;

export const ProposalMapper = {
  toApi: (
    p: DBProposal,
    quorum: bigint,
    blockTime: number,
  ): ProposalResponse => {
    return {
      id: p.id,
      daoId: p.daoId,
      txHash: p.txHash,
      proposerAccountId: p.proposerAccountId,
      title: p.title,
      description: p.description,
      startBlock: p.startBlock,
      endBlock: p.endBlock,
      timestamp: Number(p.timestamp),
      status: p.status,
      forVotes: p.forVotes.toString(),
      againstVotes: p.againstVotes.toString(),
      abstainVotes: p.abstainVotes.toString(),
      endTimestamp: Number(p.endTimestamp),
      startTimestamp: Math.trunc(
        Number(p.endTimestamp) - (p.endBlock - p.startBlock) * blockTime,
      ),
      quorum: quorum.toString(),
      calldatas: p.calldatas,
      values: p.values.map((v) => v.toString()),
      targets: p.targets,
      proposalType: p.proposalType,
    };
  },
};
