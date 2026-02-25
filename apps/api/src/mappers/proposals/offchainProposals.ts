import { z } from "@hono/zod-openapi";

import { offchainProposals } from "@/database";

export type DBOffchainProposal = typeof offchainProposals.$inferSelect;

export const OffchainProposalResponseSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  author: z.string(),
  title: z.string(),
  body: z.string(),
  discussion: z.string(),
  type: z.string(),
  start: z.number(),
  end: z.number(),
  state: z.string(),
  created: z.number(),
  updated: z.number(),
  link: z.string(),
  flagged: z.boolean(),
});

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

export const OffchainProposalsResponseSchema = z.object({
  items: z.array(OffchainProposalResponseSchema),
  totalCount: z.number(),
});

export const OffchainProposalsRequestSchema = z.object({
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(1000, "Limit cannot exceed 1000")
    .optional()
    .default(10),
  orderDirection: z.enum(["asc", "desc"]).default("desc").optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return typeof val === "string" ? [val] : val;
    }),
  fromDate: z.coerce.number().optional(),
});
