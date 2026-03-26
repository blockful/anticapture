import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { votesOnchain } from "@/database";
import {
  normalizeQueryArray,
  OrderDirectionSchema,
  unixTimestampQueryParam,
  VoteSupportSchema,
} from "../shared";

export type DBVote = typeof votesOnchain.$inferSelect;

const StringArrayQuerySchema = z
  .array(
    z.string().refine((val) => isAddress(val, { strict: false }), {
      message: "Invalid address",
    }),
  )
  .openapi("OnchainVoteAddressList");

export const VotesRequestSchema = z
  .object({
    skip: z.coerce
      .number()
      .int()
      .min(0, "Skip must be a non-negative integer")
      .optional()
      .default(0)
      .openapi({
        description: "Number of votes to skip before collecting results.",
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
        description: "Maximum number of votes to return.",
        example: 10,
      }),
    voterAddressIn: z
      .preprocess(
        normalizeQueryArray,
        StringArrayQuerySchema.transform((values) =>
          values.map((val) => getAddress(val)),
        ).optional(),
      )
      .openapi({
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
    toDate: unixTimestampQueryParam(
      "Latest vote timestamp, in Unix seconds.",
      1700086400,
    ),
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
