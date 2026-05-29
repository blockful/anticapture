import { z } from "@hono/zod-openapi";

import { proposalsOnchain } from "@/database";
import { ProposalStatus } from "@/lib/constants";
import {
  booleanQueryParam,
  commaDelimitedEnumQueryParam,
  daoIdField,
  decimalStringField,
  defaultDescOrderDirection,
  paginatedListResponse,
  paginationQueryParams,
  unixSecondsIntField,
  unixTimestampQueryParam,
} from "../shared";

export type DBProposal = typeof proposalsOnchain.$inferSelect;

const OnchainProposalStatusValues = Object.values(ProposalStatus) as [
  ProposalStatus,
  ...ProposalStatus[],
];

const OnchainProposalStatusListSchema = commaDelimitedEnumQueryParam(
  OnchainProposalStatusValues,
  (input) => input.toUpperCase(),
);

const leanQueryParam = () =>
  booleanQueryParam(false).openapi({
    description:
      "When true, omit execution-payload fields (calldatas, values, targets) and the proposal description to reduce response size. Defaults to false. Accepts true/false/1/0.",
    example: false,
  });

export const ProposalsRequestSchema = z
  .object({
    ...paginationQueryParams(),
    orderDirection: defaultDescOrderDirection(),
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
    lean: leanQueryParam(),
  })
  .openapi("OnchainProposalsRequest");

export type ProposalsRequest = z.infer<typeof ProposalsRequestSchema>;

export const ProposalSearchRequestSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(1)
      .openapi({
        param: {
          name: "query",
          in: "query",
        },
        description: "Partial proposal identifier or title to search for.",
        example: "test",
      }),
    ...paginationQueryParams(),
    lean: leanQueryParam(),
  })
  .openapi("OnchainProposalSearchRequest");

export const ProposalByIdQuerySchema = z
  .object({
    lean: leanQueryParam(),
  })
  .openapi("OnchainProposalByIdQuery");

export type ProposalSearchRequest = z.infer<typeof ProposalSearchRequestSchema>;

const ProposalCoreSchema = z.object({
  id: z.string().openapi({ description: "Onchain proposal identifier." }),
  daoId: daoIdField(),
  txHash: z
    .string()
    .openapi({ description: "Proposal creation transaction hash." }),
  proposerAccountId: z.string().openapi({
    description: "Address that created the proposal.",
    format: "ethereum-address",
  }),
  title: z.string().openapi({ description: "Proposal title." }),
  startBlock: z.number().int().openapi({ description: "Start block number." }),
  endBlock: z.number().int().openapi({ description: "End block number." }),
  timestamp: unixSecondsIntField(
    "Proposal creation timestamp in Unix seconds.",
  ),
  status: z.string().openapi({ description: "Current proposal status." }),
  forVotes: decimalStringField(
    "Votes cast in favor, encoded as a decimal string.",
  ),
  againstVotes: decimalStringField(
    "Votes cast against, encoded as a decimal string.",
  ),
  abstainVotes: decimalStringField(
    "Abstain votes, encoded as a decimal string.",
  ),
  startTimestamp: unixSecondsIntField(
    "Proposal start timestamp in Unix seconds.",
  ),
  endTimestamp: unixSecondsIntField("Proposal end timestamp in Unix seconds."),
  queuedTimestamp: unixSecondsIntField(
    "Timestamp (Unix seconds) when the proposal was queued, or null if it never was.",
  ).nullable(),
  executedTimestamp: unixSecondsIntField(
    "Timestamp (Unix seconds) when the proposal was executed, or null if it never was.",
  ).nullable(),
  queuedTxHash: z.string().nullable().openapi({
    description:
      "Transaction hash of the queue event, or null if the proposal was never queued.",
  }),
  executedTxHash: z.string().nullable().openapi({
    description:
      "Transaction hash of the execute event, or null if the proposal was never executed.",
  }),
  quorum: decimalStringField("Required quorum encoded as a decimal string."),
  proposalType: z.number().int().nullable().openapi({
    description: "Optional proposal type discriminator.",
  }),
});

const FullProposalSchema = ProposalCoreSchema.extend({
  variant: z.literal("full").openapi({
    description:
      "Discriminator. `full` when the execution payload and proposal description are included.",
  }),
  description: z.string().openapi({ description: "Proposal body." }),
  calldatas: z.array(z.string()).openapi({
    description: "Encoded calldata payloads executed by the proposal.",
  }),
  values: z.array(z.string().openapi({ format: "bigint" })).openapi({
    description: "ETH values attached to each call, encoded as strings.",
  }),
  targets: z.array(z.string().openapi({ format: "ethereum-address" })).openapi({
    description: "Contract targets invoked by the proposal.",
  }),
}).openapi("OnchainFullProposal", {
  description:
    "Full onchain proposal, returned when the request does not set `lean=true`.",
});

const LeanProposalSchema = ProposalCoreSchema.extend({
  variant: z.literal("lean").openapi({
    description:
      "Discriminator. `lean` when the execution payload (calldatas/values/targets) and proposal description are omitted to reduce response size.",
  }),
}).openapi("OnchainLeanProposal", {
  description:
    "Lean onchain proposal, returned when the request sets `lean=true`. Omits calldatas/values/targets and the proposal description.",
});

export const ProposalResponseSchema = z
  .discriminatedUnion("variant", [FullProposalSchema, LeanProposalSchema])
  .openapi("OnchainProposal", {
    description:
      "Onchain proposal. Narrow by the `variant` discriminator: `full` includes the execution payload and description; `lean` omits them.",
  });

export const ProposalsResponseSchema = paginatedListResponse(
  ProposalResponseSchema,
).openapi("OnchainProposalsResponse");

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
    options: { lean?: boolean } = {},
  ): ProposalResponse => {
    const core = {
      id: p.id,
      daoId: p.daoId,
      txHash: p.txHash,
      proposerAccountId: p.proposerAccountId,
      title: p.title,
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
      proposalType: p.proposalType,
      queuedTimestamp:
        p.queuedTimestamp === null ? null : Number(p.queuedTimestamp),
      executedTimestamp:
        p.executedTimestamp === null ? null : Number(p.executedTimestamp),
      queuedTxHash: p.queuedTxHash,
      executedTxHash: p.executedTxHash,
    };
    if (options.lean) return { ...core, variant: "lean" };
    return {
      ...core,
      variant: "full",
      description: p.description,
      calldatas: p.calldatas,
      values: p.values.map((v) => v.toString()),
      targets: p.targets,
    };
  },
};
