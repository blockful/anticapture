import { z } from "@hono/zod-openapi";
import { isAddress } from "viem";

export const VotersRequestSchema = z.object({
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
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(10),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type VotersRequest = z.infer<typeof VotersRequestSchema>;

export const VoterResponseSchema = z.object({
  voter: z.string().refine((val) => isAddress(val)),
  votingPower: z.string(),
  lastVoteTimestamp: z.number(),
  votingPowerVariation: z.string(),
});

export type VoterResponse = z.infer<typeof VoterResponseSchema>;

export const VotersResponseSchema = z.object({
  items: z.array(VoterResponseSchema),
  totalCount: z.number(),
});

export type VotersResponse = z.infer<typeof VotersResponseSchema>;
