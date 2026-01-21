import { z } from "@hono/zod-openapi";
import { Address, getAddress, isAddress } from "viem";
import { DelegationItem, DelegationsResponse } from "./historical";
import { delegation } from "ponder:schema";

export type DBDelegation = Pick<
  typeof delegation.$inferSelect,
  | "timestamp"
  | "transactionHash"
  | "delegateAccountId"
  | "delegatorAccountId"
  | "delegatedValue"
  | "previousDelegate"
>;

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
      z.array(
        z
          .string()
          .refine((val) => isAddress(val, { strict: false })),
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
