import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { votesOnchain } from "@/database";

export type DBVote = typeof votesOnchain.$inferSelect;

export const VotesRequestSchema = z.object({
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  limit: z.coerce
    .number()
    .max(1000, "Limit cannot exceed 1000")
    .optional()
    .default(10),
  voterAddressIn: z
    .union([
      z
        .string()
        .refine((val) => isAddress(val, { strict: false }))
        .transform((val) => [getAddress(val)]),
      z.array(
        z
          .string()
          .refine((val) => isAddress(val, { strict: false }))
          .transform((val) => getAddress(val)),
      ),
    ])
    .optional(),
  orderBy: z.enum(["timestamp", "votingPower"]).optional().default("timestamp"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  support: z.coerce
    .number()
    .transform((val) => String(val)) // Support for the vote like For, Against, Abstain
    .optional(),
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
});

export type VotesRequest = z.infer<typeof VotesRequestSchema>;

export const VoteResponseSchema = z.object({
  voterAddress: z.string(),
  transactionHash: z.string(),
  proposalId: z.string(),
  support: z.number(),
  votingPower: z.string(),
  reason: z.string().optional(),
  timestamp: z.number(),
  proposalTitle: z.string(),
});

export type VoteResponse = z.infer<typeof VoteResponseSchema>;

export const VotesResponseSchema = z.object({
  items: z.array(VoteResponseSchema),
  totalCount: z.number(),
});

export type VotesResponse = z.infer<typeof VotesResponseSchema>;

export * from "./offchainVotes";
