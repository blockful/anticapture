import { Address, Hex } from "viem";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyBaseLogger, FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from "fastify";

export enum DAO_ID {
  ENS = "ENS",
  UNI = "UNI",
  ARB = "ARB",
  OP = "OP",
  SCR = "SCR",
  GTC = "GTC"
}
/**
 * FastifyTypedInstance type provides proper typing for Fastify with Zod integration.
 * 
 * This custom type:
 * - Ensures Zod schema validation for request/response is properly typed
 * - Provides better IDE autocomplete when defining routes
 * - Enforces type safety between schemas and handlers
 * - Enables end-to-end type checking from request parsing to response serialization
 * 
 */
export type FastifyTypedInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>;

export interface PetitionSignatureRequest {
  message: string;
  signature: Hex;
  accountId: Address;
  daoId: DAO_ID;
}

export interface PetitionSignatureResponse extends PetitionSignatureRequest {
  timestamp: bigint;
}
