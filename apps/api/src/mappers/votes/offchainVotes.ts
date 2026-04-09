import { z } from "@hono/zod-openapi";

import { offchainVotes } from "@/database";
import {
  AddressQueryArraySchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";

export type DBOffchainVote = typeof offchainVotes.$inferSelect;

export const OffchainVotesRequestSchema = z
  .object({
    skip: paginationSkipQueryParam(),
    limit: paginationLimitQueryParam(),
    orderBy: z
      .enum(["timestamp", "votingPower"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Sort votes by timestamp or voting power.",
        example: "timestamp",
      }),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    voterAddresses: AddressQueryArraySchema.optional().openapi({
      type: "array",
      items: { type: "string" },
      description:
        "Filter by one or more voter addresses. Pass repeated query params or a comma-delimited list.",
    }),
    fromDate: unixTimestampQueryParam(
      "Earliest vote timestamp, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam("Latest vote timestamp, in Unix seconds."),
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
    voter: z.string(),
    proposalId: z.string(),
    choice: OffchainVoteChoiceSchema,
    vp: z.coerce.number(),
    reason: z.string(),
    created: z.number().int(),
    proposalTitle: z.string().nullable(),
  })
  .openapi("OffchainVote");

export type OffchainVoteResponse = z.infer<typeof OffchainVoteResponseSchema>;

export const OffchainVotesResponseSchema = z
  .object({
    items: z.array(OffchainVoteResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("OffchainVotesResponse");
