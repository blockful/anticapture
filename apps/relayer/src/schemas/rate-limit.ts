import { z } from "@hono/zod-openapi";

import { AddressSchema } from "@/schemas/evm-primitives";

export const RateLimitParamsSchema = z.object({
  address: AddressSchema,
});

const OperationUsageSchema = z.object({
  used: z.number().int().min(0),
  remaining: z.number().int().min(0),
  limit: z.number().int().min(0),
});

export const RateLimitResponseSchema = z
  .object({
    address: AddressSchema.describe("EIP-55 checksummed Ethereum address."),
    vote: OperationUsageSchema,
    delegation: OperationUsageSchema,
    resetsAt: z.iso
      .datetime()
      .describe("ISO 8601 timestamp of the next UTC month start."),
  })
  .openapi("RelayerRateLimitResponse");
