import { z } from "@hono/zod-openapi";

import {
  AddressSchema,
  Bytes32Schema,
  DecimalUint256Schema,
  TxHashSchema,
} from "./evm-primitives";

export const RelayDelegateRequestSchema = z
  .object({
    delegatee: AddressSchema,
    nonce: DecimalUint256Schema.openapi({
      type: "string",
      description: "Delegation nonce as decimal string",
      example: "0",
    }),
    expiry: DecimalUint256Schema.openapi({
      type: "string",
      description: "Signature expiry timestamp as decimal string",
      example: "1718000000",
    }),
    v: z.number().int().min(0).max(255),
    r: Bytes32Schema,
    s: Bytes32Schema,
  })
  .openapi("RelayDelegateRequest");

export const RelayDelegateResponseSchema = z
  .object({
    transactionHash: TxHashSchema,
    delegator: AddressSchema,
  })
  .openapi("RelayDelegateResponse");

export type RelayDelegateRequest = z.input<typeof RelayDelegateRequestSchema>;
