import { z } from "@hono/zod-openapi";

import {
  AddressQueryArraySchema,
  AddressSchema,
  addressPathParams,
  defaultDescOrderDirection,
  paginatedListResponse,
  paginationQueryParams,
} from "../shared";

export const HistoricalDelegationsRequestParamsSchema = addressPathParams(
  "HistoricalDelegationsRequestParams",
  "Path params for historical delegations queries.",
);

export const HistoricalDelegationsRequestQuerySchema = z
  .object({
    delegateAddressIn: AddressQueryArraySchema.optional(),
    ...paginationQueryParams(),
    fromValue: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
    toValue: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
    orderDirection: defaultDescOrderDirection(),
  })
  .openapi("HistoricalDelegationsRequestQuery", {
    description: "Query params used to page and filter historical delegations.",
  });

export type HistoricalDelegationsRequestQuery = z.infer<
  typeof HistoricalDelegationsRequestQuerySchema
>;

export const DelegationItemSchema = z
  .object({
    delegatorAddress: AddressSchema.openapi({ format: "ethereum-address" }),
    delegateAddress: AddressSchema.openapi({ format: "ethereum-address" }),
    amount: z.string().openapi({ format: "bigint" }),
    timestamp: z.string().openapi({ format: "bigint" }),
    transactionHash: z.string(),
  })
  .openapi("DelegationItem", {
    description:
      "Single delegation transfer event in the historical delegation feed.",
  });

export const DelegationsResponseSchema = paginatedListResponse(
  DelegationItemSchema,
).openapi("DelegationsResponse", {
  description: "Paginated historical delegations response.",
});

export type DelegationsResponse = z.infer<typeof DelegationsResponseSchema>;
export type DelegationItem = z.infer<typeof DelegationItemSchema>;
