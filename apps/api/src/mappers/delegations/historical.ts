import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { normalizeQueryArray, OrderDirectionSchema } from "../shared";

const DelegateAddressListSchema = z
  .array(
    z
      .string()
      .refine((val) => isAddress(val, { strict: false }))
      .transform((val) => getAddress(val)),
  )
  .openapi("DelegateAddressList");

export const HistoricalDelegationsRequestParamsSchema = z
  .object({
    address: z.string().refine((val) => isAddress(val, { strict: false })),
  })
  .openapi("HistoricalDelegationsRequestParams", {
    description: "Path params for historical delegations queries.",
  });

export const HistoricalDelegationsRequestQuerySchema = z
  .object({
    delegateAddressIn: z
      .preprocess(normalizeQueryArray, DelegateAddressListSchema.optional())
      .optional(),
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
    fromValue: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
    toValue: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
  })
  .openapi("HistoricalDelegationsRequestQuery", {
    description: "Query params used to page and filter historical delegations.",
  });

export type HistoricalDelegationsRequestQuery = z.infer<
  typeof HistoricalDelegationsRequestQuerySchema
>;

export const DelegationItemSchema = z
  .object({
    delegatorAddress: z
      .string()
      .refine((val) => isAddress(val, { strict: false }))
      .transform((val) => getAddress(val)),
    delegateAddress: z
      .string()
      .refine((val) => isAddress(val, { strict: false }))
      .transform((val) => getAddress(val)),
    amount: z.string(),
    timestamp: z.string(),
    transactionHash: z.string(),
  })
  .openapi("DelegationItem", {
    description:
      "Single delegation transfer event in the historical delegation feed.",
  });

export const DelegationsResponseSchema = z
  .object({
    items: z.array(DelegationItemSchema),
    totalCount: z.number().int(),
  })
  .openapi("DelegationsResponse", {
    description: "Paginated historical delegations response.",
  });

export type DelegationsResponse = z.infer<typeof DelegationsResponseSchema>;
export type DelegationItem = z.infer<typeof DelegationItemSchema>;
