import { z } from "@hono/zod-openapi";

import { offchainProposals } from "@/database";
import {
  normalizeQueryArray,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";

export type DBOffchainProposal = typeof offchainProposals.$inferSelect;

const StringArrayQuerySchema = z
  .array(z.string())
  .openapi("OffchainProposalStatusList");

export const OffchainProposalResponseSchema = z
  .object({
    id: z.string().openapi({ description: "Snapshot proposal identifier." }),
    spaceId: z.string().openapi({ description: "Snapshot space identifier." }),
    author: z
      .string()
      .openapi({ description: "Address or ENS of the author." }),
    title: z.string().openapi({ description: "Proposal title." }),
    body: z.string().openapi({ description: "Proposal body." }),
    discussion: z
      .string()
      .openapi({ description: "Discussion URL or thread reference." }),
    type: z.string().openapi({ description: "Snapshot proposal type." }),
    start: z.number().int().openapi({
      description: "Voting start timestamp in Unix seconds.",
    }),
    end: z.number().int().openapi({
      description: "Voting end timestamp in Unix seconds.",
    }),
    state: z
      .string()
      .openapi({ description: "Current Snapshot proposal state." }),
    created: z.number().int().openapi({
      description: "Creation timestamp in Unix seconds.",
    }),
    updated: z.number().int().openapi({
      description: "Last update timestamp in Unix seconds.",
    }),
    link: z
      .string()
      .openapi({ description: "Canonical Snapshot proposal URL." }),
    flagged: z.boolean().openapi({
      description: "Whether the proposal was flagged by Snapshot.",
    }),
  })
  .openapi("OffchainProposal");

export type OffchainProposalResponse = z.infer<
  typeof OffchainProposalResponseSchema
>;

export const OffchainProposalMapper = {
  toApi: (p: DBOffchainProposal): OffchainProposalResponse => ({
    id: p.id,
    spaceId: p.spaceId,
    author: p.author,
    title: p.title,
    body: p.body,
    discussion: p.discussion,
    type: p.type,
    start: p.start,
    end: p.end,
    state: p.state,
    created: p.created,
    updated: p.updated,
    link: p.link,
    flagged: p.flagged,
  }),
};

export const OffchainProposalsResponseSchema = z
  .object({
    items: z.array(OffchainProposalResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("OffchainProposalsResponse");

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

export const OffchainProposalsRequestSchema = z
  .object({
    skip: paginationSkipQueryParam(),
    limit: paginationLimitQueryParam(),
    orderDirection: OrderDirectionSchema.default("desc").optional(),
    status: z
      .preprocess(normalizeQueryArray, StringArrayQuerySchema.optional())
      .openapi({
        description:
          "Snapshot proposal state filter. Pass repeated query params or a comma-delimited list.",
        example: ["active"],
      }),
    fromDate: unixTimestampQueryParam(
      "Earliest proposal creation timestamp, in Unix seconds.",
    ),
    endDate: unixTimestampQueryParam(
      "Latest proposal creation timestamp, in Unix seconds.",
    ),
  })
  .openapi("OffchainProposalsRequest");
