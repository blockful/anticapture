import type { FastifyBaseLogger, FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { Address, Hex } from "viem";

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
  daoId: string;
  timestamp: bigint;
}

export interface PetitionSignatureResponse extends PetitionSignatureRequest {
  votingPower: bigint;
}
