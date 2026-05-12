import { z } from "@hono/zod-openapi";
import { Address } from "viem";

import {
  AddressSchema,
  addressPathParams,
  bigintAsStringField,
  defaultDescOrderDirection,
  paginatedListResponse,
  paginationQueryParams,
} from "../shared";

export type AggregatedDelegator = {
  delegatorAddress: Address;
  amount: bigint;
  timestamp: bigint;
};

export const DelegatorsRequestParamsSchema = addressPathParams(
  "DelegatorsRequestParams",
  "Path params for fetching delegators of a delegate address.",
);

export const DelegatorsRequestQuerySchema = z
  .object({
    ...paginationQueryParams(),
    orderBy: z.enum(["amount", "timestamp"]).optional().default("amount"),
    orderDirection: defaultDescOrderDirection(),
  })
  .openapi("DelegatorsRequestQuery", {
    description:
      "Query params used to page and sort delegators for a delegate address.",
  });

export type DelegatorsRequestQuery = z.infer<
  typeof DelegatorsRequestQuerySchema
>;

export const DelegatorItemSchema = z
  .object({
    delegatorAddress: AddressSchema,
    amount: bigintAsStringField(),
    timestamp: bigintAsStringField(),
  })
  .openapi("DelegatorItem", {
    description:
      "Aggregated delegation amount and latest timestamp for one delegator.",
  });

export const DelegatorsResponseSchema = paginatedListResponse(
  DelegatorItemSchema,
).openapi("DelegatorsResponse", {
  description: "Paginated delegators for a delegate address.",
});

export type DelegatorItem = z.infer<typeof DelegatorItemSchema>;
export type DelegatorsResponse = z.infer<typeof DelegatorsResponseSchema>;
