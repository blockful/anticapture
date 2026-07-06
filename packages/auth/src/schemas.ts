import { getAddress, isAddress } from "viem";
import { z } from "@hono/zod-openapi";

/**
 * Validates and checksums an Ethereum address — the standard viem idiom
 * (`isAddress` + `getAddress`). Self-contained on purpose: a package cannot
 * import from an app, and this is a stable primitive with no app-specific
 * logic. `apps/api/src/mappers/shared.ts` defines an equivalent schema for its
 * own use; the two are independent (no manual sync needed). If the API later
 * adopts this package, it can re-export this one as the single source of truth.
 */
export const AddressSchema = z
  .string()
  .refine((addr) => isAddress(addr, { strict: false }), "Invalid address")
  .transform((addr) => getAddress(addr));

export const SiweVerifyBodySchema = z
  .object({
    // Upper bounds guard an unauthenticated endpoint against oversized payloads;
    // a real SIWE message and signature are well under these limits.
    message: z.string().min(1).max(4096),
    signature: z
      .string()
      .regex(/^0x[0-9a-fA-F]+$/)
      .max(3000),
  })
  .openapi("SiweVerifyBody");

export const NonceResponseSchema = z
  .object({
    nonce: z.string(),
  })
  .openapi("NonceResponse");
