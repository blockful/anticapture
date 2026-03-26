import { z } from "@hono/zod-openapi";

import { offchainProposals } from "@/database";
import {
  normalizeQueryArray,
  OrderDirectionSchema,
  unixTimestampQueryParam,
} from "../shared";

export type DBOffchainProposal = typeof offchainProposals.$inferSelect;

const StringArrayQuerySchema = z
  .array(z.string())
  .openapi("OffchainProposalStatusList");

export const OffchainProposalResponseSchema = z
  .object({
    id: z.string(),
    spaceId: z.string(),
    author: z.string(),
    title: z.string(),
    body: z.string(),
    discussion: z.string(),
    type: z.string(),
    start: z.number().int(),
    end: z.number().int(),
    state: z.string(),
    created: z.number().int(),
    updated: z.number().int(),
    link: z.string(),
    flagged: z.boolean(),
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
