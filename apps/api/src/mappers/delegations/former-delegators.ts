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

export type DBFormerDelegator = {
  delegatorAddress: Address;
  amount: bigint;
  redelegatedAmount: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  redelegatedTo: Address | null;
};

export const FormerDelegatorsRequestParamsSchema = addressPathParams(
  "FormerDelegatorsRequestParams",
  "Path params for fetching former delegators of a delegate address.",
);

export const FormerDelegatorsRequestQuerySchema = z
  .object({
    ...paginationQueryParams(),
    orderDirection: defaultDescOrderDirection(),
  })
  .openapi("FormerDelegatorsRequestQuery", {
    description:
      "Query params used to page former delegators for a delegate address. Results are ordered by the timestamp the delegator moved away.",
  });

export type FormerDelegatorsRequestQuery = z.infer<
  typeof FormerDelegatorsRequestQuerySchema
>;

export const FormerDelegatorItemSchema = z
  .object({
    delegatorAddress: AddressSchema.openapi({ format: "ethereum-address" }),
    amount: bigintAsStringField(
      "Last delegated amount while delegating to the queried address, encoded as a decimal string.",
    ),
    redelegatedAmount: bigintAsStringField(
      "Delegated amount at the move-away event (the delegator's value once they left the queried address), encoded as a decimal string.",
    ),
    startTimestamp: bigintAsStringField(
      "Timestamp of the first delegation event of the last delegation stint, in Unix seconds.",
    ),
    endTimestamp: bigintAsStringField(
      "Timestamp of the event where the delegator moved away, in Unix seconds.",
    ),
    redelegatedTo: AddressSchema.nullable().openapi({
      description:
        "Delegate the delegator moved to, when known. Null when the move-away event does not reference the queried address as the previous delegate.",
      format: "ethereum-address",
    }),
  })
  .openapi("FormerDelegatorItem", {
    description:
      "Delegator that delegated to the queried address in the past but whose latest delegation is no longer to it.",
  });

export const FormerDelegatorsResponseSchema = paginatedListResponse(
  FormerDelegatorItemSchema,
).openapi("FormerDelegatorsResponse", {
  description: "Paginated former delegators for a delegate address.",
});

export type FormerDelegatorItem = z.infer<typeof FormerDelegatorItemSchema>;
export type FormerDelegatorsResponse = z.infer<
  typeof FormerDelegatorsResponseSchema
>;
