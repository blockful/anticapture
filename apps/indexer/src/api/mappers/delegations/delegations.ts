import { z } from "@hono/zod-openapi";
import { isAddress } from "viem";
import { DelegationItem, DelegationsResponse } from "./historical";
import { delegation } from "ponder:schema";

export type DBDelegation = typeof delegation.$inferSelect;

export const DelegationsRequestParamsSchema = z.object({
  address: z.string().refine((val) => isAddress(val, { strict: false })),
});

export const DelegationsRequestQuerySchema = z.object({
  delegateAddressIn: z
    .union([
      z
        .string()
        .refine((val) => isAddress(val, { strict: false }))
        .transform((val) => [val]),
      z.array(z.string().refine((val) => isAddress(val, { strict: false }))),
    ])
    .optional(),
});

export type DelegationsRequestQuery = z.infer<
  typeof DelegationsRequestQuerySchema
>;

export const delegationMapper = (d: DBDelegation): DelegationItem => {
  return {
    delegatorAddress: d.delegatorAccountId,
    delegateAddress: d.delegateAccountId,
    amount: d.delegatedValue.toString(),
    timestamp: d.timestamp.toString(),
    transactionHash: d.transactionHash,
  };
};

export const delegationsResponseMapper = (d: {
  items: DBDelegation[];
  totalCount: number;
}): DelegationsResponse => {
  return {
    items: d.items.map(delegationMapper),
    totalCount: d.totalCount,
  };
};
