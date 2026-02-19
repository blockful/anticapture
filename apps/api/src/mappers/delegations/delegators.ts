import { z } from "@hono/zod-openapi";
import { Address, getAddress, isAddress } from "viem";

export type AggregatedDelegator = {
  delegatorAddress: Address;
  amount: bigint;
  timestamp: bigint;
};

export const DelegatorsRequestParamsSchema = z.object({
  address: z
    .string()
    .refine((val) => isAddress(val, { strict: false }))
    .transform((val) => getAddress(val)),
});

export const DelegatorsRequestQuerySchema = z.object({
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
  orderBy: z.enum(["amount", "timestamp"]).optional().default("amount"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type DelegatorsRequestQuery = z.infer<
  typeof DelegatorsRequestQuerySchema
>;

export const DelegatorItemSchema = z.object({
  delegatorAddress: z
    .string()
    .refine((val) => isAddress(val, { strict: false })),
  amount: z.bigint().transform((val) => val.toString()),
  timestamp: z.bigint().transform((val) => val.toString()),
});

export const DelegatorsResponseSchema = z.object({
  items: z.array(DelegatorItemSchema),
  totalCount: z.number(),
});

export type DelegatorItem = z.infer<typeof DelegatorItemSchema>;
export type DelegatorsResponse = z.infer<typeof DelegatorsResponseSchema>;
