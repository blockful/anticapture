import { z } from "@hono/zod-openapi";

import {
  AddressQueryArraySchema,
  AddressSchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
} from "../shared";

export const HistoricalDelegationsRequestParamsSchema = z
  .object({
    address: AddressSchema,
  })
  .openapi("HistoricalDelegationsRequestParams", {
    description: "Path params for historical delegations queries.",
  });

export const HistoricalDelegationsRequestQuerySchema = z
  .object({
    delegateAddressIn: AddressQueryArraySchema.optional(),
    skip: paginationSkipQueryParam(),
    limit: paginationLimitQueryParam(),
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
    delegatorAddress: AddressSchema,
    delegateAddress: AddressSchema,
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
