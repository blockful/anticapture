import { z } from "@hono/zod-openapi";
import { isAddress, getAddress } from "viem";

import { offchainVotes } from "@/database";
import {
  normalizeQueryArray,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";

export type DBOffchainVote = typeof offchainVotes.$inferSelect;

const StringArrayQuerySchema = z
  .array(
    z.string().refine((val) => isAddress(val, { strict: false }), {
      message: "Invalid address",
    }),
  )
  .openapi("SnapshotVoteAddressList");

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
    voterAddresses: z
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
    fromDate: unixTimestampQueryParam(
      "Earliest vote timestamp, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam("Latest vote timestamp, in Unix seconds."),
  })
  .openapi("OffchainVotesRequest");

export type OffchainVotesRequest = z.infer<typeof OffchainVotesRequestSchema>;

export const OffchainVoteChoiceSchema = z
  .record(z.string(), z.number())
  .openapi("SnapshotVoteChoice");

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
