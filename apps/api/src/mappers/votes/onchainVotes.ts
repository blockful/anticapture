import { z } from "@hono/zod-openapi";

import { votesOnchain } from "@/database";
import {
  AddressQueryArraySchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
  VoteSupportSchema,
} from "../shared";

export type DBVote = typeof votesOnchain.$inferSelect;

export const VotesRequestSchema = z
  .object({
    skip: paginationSkipQueryParam(),
    limit: paginationLimitQueryParam(),
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
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    support: VoteSupportSchema.optional(),
    fromDate: unixTimestampQueryParam(
      "Earliest vote timestamp, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam("Latest vote timestamp, in Unix seconds."),
  })
  .openapi("OnchainVotesRequest");

export type VotesRequest = z.infer<typeof VotesRequestSchema>;

export const VoteResponseSchema = z
  .object({
    voterAddress: z.string(),
    transactionHash: z.string(),
    proposalId: z.string(),
    support: VoteSupportSchema.optional(),
    votingPower: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({
        type: "string",
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

export const VotesResponseSchema = z
  .object({
    items: z.array(VoteResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("OnchainVotesResponse");

export type VotesResponse = z.infer<typeof VotesResponseSchema>;
