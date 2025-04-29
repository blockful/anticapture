import { Address, Hex } from "viem";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyBaseLogger, FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from "fastify";

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
}

export interface PetitionSignatureResponse extends PetitionSignatureRequest {
  votingPower: bigint;
  timestamp: bigint;
}

export type DBPetitionSignature = Omit<PetitionSignatureResponse, "votingPower">
