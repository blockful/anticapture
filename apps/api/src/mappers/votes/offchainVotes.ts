import { z } from "@hono/zod-openapi";

import { offchainVotes } from "@/database";
import {
  AddressQueryArraySchema,
  defaultDescOrderDirection,
  earliestLatestDateRangeQueryParams,
  paginatedListResponse,
  paginationQueryParams,
} from "../shared";

export type DBOffchainVote = typeof offchainVotes.$inferSelect;

export const OffchainVotesRequestSchema = z
  .object({
    ...paginationQueryParams(),
    orderBy: z
      .enum(["timestamp", "votingPower"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Sort votes by timestamp or voting power.",
        example: "timestamp",
      }),
    orderDirection: defaultDescOrderDirection(),
    voterAddresses: AddressQueryArraySchema.optional().openapi({
      type: "array",
      items: { type: "string" },
      description:
        "Filter by one or more voter addresses. Pass repeated query params or a comma-delimited list.",
    }),
    ...earliestLatestDateRangeQueryParams("vote"),
  })
  .openapi("OffchainVotesRequest");

export type OffchainVotesRequest = z.infer<typeof OffchainVotesRequestSchema>;

export const OffchainVoteChoiceSchema = z
  .preprocess((val) => {
    if (typeof val === "number") return [val.toString()];
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "object" && val !== null) return Object.keys(val);
    return [];
  }, z.array(z.string()))
  .openapi("SnapshotVoteChoice", {
    type: "array",
    items: { type: "string", nullable: false },
  });

export const OffchainVoteResponseSchema = z
  .object({
    voter: z.string().openapi({ format: "ethereum-address" }),
    proposalId: z.string(),
    choice: OffchainVoteChoiceSchema,
    vp: z.coerce.number(),
    reason: z.string(),
    created: z.number().int(),
    proposalTitle: z.string().nullable(),
  })
  .openapi("OffchainVote");

export type OffchainVoteResponse = z.infer<typeof OffchainVoteResponseSchema>;

export const OffchainVotesResponseSchema = paginatedListResponse(
  OffchainVoteResponseSchema,
).openapi("OffchainVotesResponse");
