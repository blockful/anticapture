import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

export const OffchainVotersRequestSchema = z.object({
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
  addresses: z
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
});

export type OffchainVotersRequest = z.infer<typeof OffchainVotersRequestSchema>;

export const OffchainVoterResponseSchema = z.object({
  voter: z.string().refine((val) => isAddress(val)),
  votingPower: z.string(),
});

export type OffchainVoterResponse = z.infer<typeof OffchainVoterResponseSchema>;

export const OffchainVotersResponseSchema = z.object({
  items: z.array(OffchainVoterResponseSchema),
  totalCount: z.number(),
});

export type OffchainVotersResponse = z.infer<
  typeof OffchainVotersResponseSchema
>;
