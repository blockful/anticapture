import { z } from "@hono/zod-openapi";

import { votesOnchain } from "@/database";
import {
  AddressQueryArraySchema,
  VoteSupportSchema,
  defaultDescOrderDirection,
  earliestLatestDateRangeQueryParams,
  paginatedListResponse,
  paginationQueryParams,
} from "../shared";

export type DBVote = typeof votesOnchain.$inferSelect;

export const VotesRequestSchema = z
  .object({
    ...paginationQueryParams(),
    voterAddressIn: AddressQueryArraySchema.optional().openapi({
      type: "array",
      items: { type: "string" },
      description:
        "Filter by one or more voter addresses. Pass repeated query params or a comma-delimited list.",
    }),
    orderBy: z
      .enum(["timestamp", "votingPower"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Sort votes by timestamp or voting power.",
        example: "timestamp",
      }),
    orderDirection: defaultDescOrderDirection(),
    support: VoteSupportSchema.optional(),
    ...earliestLatestDateRangeQueryParams("vote"),
  })
  .openapi("OnchainVotesRequest");

export type VotesRequest = z.infer<typeof VotesRequestSchema>;

export const VoteResponseSchema = z
  .object({
    voterAddress: z.string().openapi({ format: "ethereum-address" }),
    transactionHash: z.string(),
    proposalId: z.string(),
    support: VoteSupportSchema.optional(),
    votingPower: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({
        type: "string",
        format: "bigint",
        description: "Voting power encoded as a decimal string.",
      }),
    reason: z.string().nullish(),
    timestamp: z
      .bigint()
      .transform((val) => Number(val))
      .openapi({
        type: "integer",
        description: "Vote timestamp in Unix seconds.",
      }),
    proposalTitle: z.string().nullish(),
  })
  .openapi("OnchainVote");

export type VoteResponse = z.infer<typeof VoteResponseSchema>;

export const VotesResponseSchema = paginatedListResponse(
  VoteResponseSchema,
).openapi("OnchainVotesResponse");

export type VotesResponse = z.infer<typeof VotesResponseSchema>;
