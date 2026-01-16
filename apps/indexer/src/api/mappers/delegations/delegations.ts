import { z } from "@hono/zod-openapi";
import { delegation } from "ponder:schema";
import { Address, getAddress, isAddress } from "viem";
import { DelegationItem, DelegationsResponse } from "./historical";

type DBDelegation = typeof delegation.$inferSelect;

export const DelegationsRequestParamsSchema = z.object({
  address: z.string().refine((val) => isAddress(val, { strict: false })),
});

export const DelegationsRequestQuerySchema = z.object({
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
});

export type DelegationsRequestQuery = z.infer<
  typeof DelegationsRequestQuerySchema
>;

export const DelegationMapper = (d: DBDelegation): DelegationItem => {
  return {
    delegatorAddress: d.delegatorAccountId as Address,
    delegateAddress: d.delegateAccountId as Address,
    amount: d.delegatedValue.toString(),
    timestamp: d.timestamp.toString(),
    transactionHash: d.transactionHash,
  };
};

export const DelegationsResponseMapper = (d: {
  items: DBDelegation[];
  totalCount: number;
}): DelegationsResponse => {
  return {
    items: d.items.map(DelegationMapper),
    totalCount: d.totalCount,
  };
};
