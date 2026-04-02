import { z } from "@hono/zod-openapi";
import { Address } from "viem";

import {
  AddressSchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
} from "../shared";

export type AggregatedDelegator = {
  delegatorAddress: Address;
  amount: bigint;
  timestamp: bigint;
};

export const DelegatorsRequestParamsSchema = z
  .object({
    address: AddressSchema,
  })
  .openapi("DelegatorsRequestParams", {
    description: "Path params for fetching delegators of a delegate address.",
  });

export const DelegatorsRequestQuerySchema = z
  .object({
    skip: paginationSkipQueryParam(),
    limit: paginationLimitQueryParam(),
    orderBy: z.enum(["amount", "timestamp"]).optional().default("amount"),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
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
    amount: z
      .union([z.bigint().transform((val) => val.toString()), z.string()])
      .openapi({ type: "string" }),
    timestamp: z
      .union([z.bigint().transform((val) => val.toString()), z.string()])
      .openapi({ type: "string" }),
  })
  .openapi("DelegatorItem", {
    description:
      "Aggregated delegation amount and latest timestamp for one delegator.",
  });

export const DelegatorsResponseSchema = z
  .object({
    items: z.array(DelegatorItemSchema),
    totalCount: z.number().int(),
  })
  .openapi("DelegatorsResponse", {
    description: "Paginated delegators for a delegate address.",
  });

export type DelegatorItem = z.infer<typeof DelegatorItemSchema>;
export type DelegatorsResponse = z.infer<typeof DelegatorsResponseSchema>;
