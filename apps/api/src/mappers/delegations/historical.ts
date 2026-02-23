import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { DBDelegation } from "./delegations";

export const HistoricalDelegationsRequestParamsSchema = z.object({
  address: z.string().refine((val) => isAddress(val, { strict: false })),
});

export const HistoricalDelegationsRequestQuerySchema = z.object({
  delegateAddressIn: z
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
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type HistoricalDelegationsRequestQuery = z.infer<
  typeof HistoricalDelegationsRequestQuerySchema
>;

export const DelegationItemSchema = z.object({
  delegatorAddress: z
    .string()
    .refine((val) => isAddress(val, { strict: false })),
  delegateAddress: z
    .string()
    .refine((val) => isAddress(val, { strict: false })),
  amount: z.string(),
  timestamp: z.string(),
  transactionHash: z.string(),
});

export const DelegationsResponseSchema = z.object({
  items: z.array(DelegationItemSchema),
  totalCount: z.number(),
});

export type DelegationsResponse = z.infer<typeof DelegationsResponseSchema>;
export type DelegationItem = z.infer<typeof DelegationItemSchema>;

const DelegationMapper = (d: DBDelegation): DelegationItem => {
  return {
    delegatorAddress: d.delegatorAccountId,
    delegateAddress: d.delegateAccountId,
    amount: d.delegatedValue.toString(),
    timestamp: d.timestamp.toString(),
    transactionHash: d.transactionHash,
  };
};

export const DelegationResponseMapper = (d: {
  items: DBDelegation[];
  totalCount: number;
}): DelegationsResponse => {
  return {
    items: d.items.map(DelegationMapper),
    totalCount: d.totalCount,
  };
};
