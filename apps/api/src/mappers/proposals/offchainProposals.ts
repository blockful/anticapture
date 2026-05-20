import { z } from "@hono/zod-openapi";

import { offchainProposals } from "@/database";
import {
  booleanQueryParam,
  commaDelimitedEnumQueryParam,
  defaultDescOrderDirection,
  paginatedListResponse,
  paginationQueryParams,
  unixSecondsIntField,
  unixTimestampQueryParam,
} from "../shared";

export type DBOffchainProposal = typeof offchainProposals.$inferSelect;

const OffchainProposalStateValues = ["active", "closed", "pending"] as const;

const OffchainProposalStatusListSchema = commaDelimitedEnumQueryParam(
  OffchainProposalStateValues,
  (input) => input.toLowerCase(),
);

export const OffchainProposalResponseSchema = z
  .object({
    id: z.string().openapi({ description: "Snapshot proposal identifier." }),
    spaceId: z.string().openapi({ description: "Snapshot space identifier." }),
    author: z
      .string()
      .openapi({ description: "Address or ENS of the author." }),
    title: z.string().openapi({ description: "Proposal title." }),
    body: z.string().optional().openapi({
      description: "Proposal body. Omitted when the request sets `lean=true`.",
    }),
    discussion: z
      .string()
      .openapi({ description: "Discussion URL or thread reference." }),
    type: z.string().openapi({ description: "Snapshot proposal type." }),
    start: unixSecondsIntField("Voting start timestamp in Unix seconds."),
    end: unixSecondsIntField("Voting end timestamp in Unix seconds."),
    state: z
      .string()
      .openapi({ description: "Current Snapshot proposal state." }),
    created: unixSecondsIntField("Creation timestamp in Unix seconds."),
    updated: unixSecondsIntField("Last update timestamp in Unix seconds."),
    link: z
      .string()
      .openapi({ description: "Canonical Snapshot proposal URL." }),
    flagged: z.boolean().openapi({
      description: "Whether the proposal was flagged by Snapshot.",
    }),
    scores: z.array(z.number()),
    choices: z.array(z.string()),
    network: z.string(),
    snapshot: z.number().nullable(),
    strategies: z.array(
      z.object({
        name: z.string(),
        network: z.string(),
        params: z.record(z.string(), z.unknown()),
      }),
    ),
  })
  .openapi("OffchainProposal");

export type OffchainProposalResponse = z.infer<
  typeof OffchainProposalResponseSchema
>;

export const OffchainProposalMapper = {
  toApi: (
    p: DBOffchainProposal,
    options: { lean?: boolean } = {},
  ): OffchainProposalResponse => {
    const base: OffchainProposalResponse = {
      id: p.id,
      spaceId: p.spaceId,
      author: p.author,
      title: p.title,
      discussion: p.discussion,
      type: p.type,
      start: p.start,
      end: p.end,
      state: p.state,
      created: p.created,
      updated: p.updated,
      link: p.link,
      flagged: p.flagged,
      scores: p.scores,
      choices: p.choices,
      network: p.network,
      snapshot: p.snapshot,
      strategies: p.strategies,
    };
    if (options.lean) return base;
    return { ...base, body: p.body };
  },
};

export const OffchainProposalsResponseSchema = paginatedListResponse(
  OffchainProposalResponseSchema,
).openapi("OffchainProposalsResponse");

const offchainLeanQueryParam = () =>
  booleanQueryParam(false).openapi({
    description:
      "When true, omit the proposal `body` to reduce response size. Defaults to false. Accepts true/false/1/0.",
    example: false,
  });

export const OffchainProposalRequestSchema = z
  .object({
    id: z.string().openapi({
      param: {
        description: "Snapshot proposal identifier.",
        example: "proposal-1",
      },
    }),
  })
  .openapi("OffchainProposalParams");

export const OffchainProposalByIdQuerySchema = z
  .object({
    lean: offchainLeanQueryParam(),
  })
  .openapi("OffchainProposalByIdQuery");

export const OffchainProposalsRequestSchema = z
  .object({
    ...paginationQueryParams(),
    orderDirection: defaultDescOrderDirection(),
    status: OffchainProposalStatusListSchema.optional().openapi(
      "OffchainProposalStatusList",
      {
        type: "array",
        items: {
          type: "string",
          enum: [...OffchainProposalStateValues],
        },
        description:
          "Snapshot proposal state filter. Pass repeated query params or a comma-delimited list.",
        example: ["active"],
      },
    ),
    fromDate: unixTimestampQueryParam(
      "Earliest proposal creation timestamp, in Unix seconds.",
    ),
    endDate: unixTimestampQueryParam(
      "Latest proposal creation timestamp, in Unix seconds.",
    ),
    lean: offchainLeanQueryParam(),
  })
  .openapi("OffchainProposalsRequest");

export const OffchainProposalSearchRequestSchema = z
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
        description:
          "Partial Snapshot proposal identifier or title to search for.",
        example: "test",
      }),
    ...paginationQueryParams(),
    lean: offchainLeanQueryParam(),
  })
  .openapi("OffchainProposalSearchRequest");
