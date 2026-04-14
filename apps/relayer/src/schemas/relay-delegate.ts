import { z } from "zod";

import { AddressSchema, Bytes32Schema, TxHashSchema } from "./shared";

export const RelayDelegateRequestSchema = z
  .object({
    delegatee: AddressSchema,
    nonce: z.string().openapi({
      description: "Delegation nonce as decimal string",
      example: "0",
    }),
    expiry: z.string().openapi({
      description: "Signature expiry timestamp as decimal string",
      example: "1718000000",
    }),
    v: z.number().int(),
    r: Bytes32Schema,
    s: Bytes32Schema,
  })
  .openapi("RelayDelegateRequest");

export const RelayDelegateResponseSchema = z
  .object({
    transactionHash: TxHashSchema,
    delegator: z.string(),
  })
  .openapi("RelayDelegateResponse");

export type RelayDelegateRequest = z.infer<typeof RelayDelegateRequestSchema>;
