import { z } from "@hono/zod-openapi";

import { proposalsOnchain } from "@/database";
import { ProposalStatus } from "@/lib/constants";
import {
  normalizeQueryArray,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";

export type DBProposal = typeof proposalsOnchain.$inferSelect;

const OnchainProposalStatusValues = Object.values(ProposalStatus) as [
  ProposalStatus,
  ...ProposalStatus[],
];

const OnchainProposalStatusListSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => {
    const statuses = normalizeQueryArray(value);
    return statuses
      ? z
          .array(z.enum(OnchainProposalStatusValues))
          .parse(statuses.map((status) => String(status).toUpperCase()))
      : undefined;
  });

export const ProposalsRequestSchema = z
  .object({
    skip: paginationSkipQueryParam(),
    limit: paginationLimitQueryParam(),
    orderDirection: OrderDirectionSchema.default("desc").optional(),
    status: OnchainProposalStatusListSchema.optional().openapi(
      "OnchainProposalStatusList",
      {
        type: "array",
        items: {
          type: "string",
          enum: OnchainProposalStatusValues,
        },
        description:
          "Proposal status filter. Pass repeated query params or a comma-delimited list.",
        example: ["ACTIVE"],
      },
    ),
    fromDate: unixTimestampQueryParam(
      "Earliest proposal timestamp, in Unix seconds.",
    ),
    fromEndDate: unixTimestampQueryParam(
      "Latest proposal end timestamp, in Unix seconds.",
    ),
    includeOptimisticProposals: z.coerce
      .boolean()
      .optional()
      .default(true)
      .openapi({
        description: "Whether optimistic proposals should be included.",
        example: false,
      }),
  })
  .openapi("OnchainProposalsRequest");

export type ProposalsRequest = z.infer<typeof ProposalsRequestSchema>;

export const ProposalResponseSchema = z
  .object({
    id: z.string().openapi({ description: "Onchain proposal identifier." }),
    daoId: z.string().openapi({ description: "DAO identifier." }),
    txHash: z
      .string()
      .openapi({ description: "Proposal creation transaction hash." }),
    proposerAccountId: z
      .string()
      .openapi({ description: "Address that created the proposal." }),
    title: z.string().openapi({ description: "Proposal title." }),
    description: z.string().openapi({ description: "Proposal body." }),
    startBlock: z
      .number()
      .int()
      .openapi({ description: "Start block number." }),
    endBlock: z.number().int().openapi({ description: "End block number." }),
    timestamp: z.number().int().openapi({
      description: "Proposal creation timestamp in Unix seconds.",
    }),
    status: z.string().openapi({ description: "Current proposal status." }),
    forVotes: z.string().openapi({
      description: "Votes cast in favor, encoded as a decimal string.",
    }),
    againstVotes: z.string().openapi({
      description: "Votes cast against, encoded as a decimal string.",
    }),
    abstainVotes: z.string().openapi({
      description: "Abstain votes, encoded as a decimal string.",
    }),
    startTimestamp: z.number().int().openapi({
      description: "Proposal start timestamp in Unix seconds.",
    }),
    endTimestamp: z.number().int().openapi({
      description: "Proposal end timestamp in Unix seconds.",
    }),
    quorum: z.string().openapi({
      description: "Required quorum encoded as a decimal string.",
    }),
    calldatas: z.array(z.string()).openapi({
      description: "Encoded calldata payloads executed by the proposal.",
    }),
    values: z.array(z.string()).openapi({
      description: "ETH values attached to each call, encoded as strings.",
    }),
    targets: z.array(z.string()).openapi({
      description: "Contract targets invoked by the proposal.",
    }),
    proposalType: z.number().int().nullable().openapi({
      description: "Optional proposal type discriminator.",
    }),
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
