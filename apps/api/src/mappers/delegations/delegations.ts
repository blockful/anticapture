import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { delegation } from "@/database";

import { DelegationItem, DelegationsResponse } from "./historical";

export type DBDelegation = typeof delegation.$inferSelect;

export const DelegationsRequestParamsSchema = z.object({
  address: z
    .string()
    .refine((val) => isAddress(val, { strict: false }))
    .transform((val) => getAddress(val)),
});

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
