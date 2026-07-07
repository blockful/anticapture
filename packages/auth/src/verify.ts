import {
  getAddress,
  recoverMessageAddress,
  type Address,
  type Client,
} from "viem";
import {
  parseSiweMessage,
  validateSiweMessage,
  verifySiweMessage,
} from "viem/siwe";

import type { NonceStore } from "./nonce.js";

export type SiweVerificationReason =
  | "malformed"
  | "bad_signature"
  | "invalid_message"
  | "wrong_chain"
  | "nonce";

export class SiweVerificationError extends Error {
  readonly reason: SiweVerificationReason;

  constructor(reason: SiweVerificationReason, message?: string) {
    super(message ?? reason);
    this.name = "SiweVerificationError";
    this.reason = reason;
  }
}

export type SiweFields = ReturnType<typeof parseSiweMessage>;

export interface VerifiedSiwe {
  address: Address;
  fields: SiweFields;
}

export interface VerifySiweSignatureParams {
  message: string;
  signature: `0x${string}`;
  /**
   * Optional viem client, on the message's chain, used to validate the
   * signature via EIP-1271/ERC-6492 (smart-contract wallets, e.g. Safes).
   * When omitted, verification assumes an EOA and recovers the signer
   * address directly from the signature.
   *
   * INVARIANT: the client MUST target the same chain as the message's
   * `chainId` (and `verifySiwe`'s `expectedChainId`); otherwise the on-chain
   * `isValidSignature` lookup runs against the wrong contract state.
   */
  client?: Client;
  time?: Date;
}

/**
 * Verifies the *authenticity* of a SIWE signature only — it does NOT assert
 * domain, chainId, expiry, or nonce validity. Those field-level checks are
 * owned exclusively by `verifySiwe`, which uses a single authoritative clock.
 */
export const verifySiweSignature = async (
  params: VerifySiweSignatureParams,
): Promise<VerifiedSiwe> => {
  const { message, signature, client, time } = params;

  const fields = parseSiweMessage(message);

  if (!fields.address) {
    throw new SiweVerificationError(
      "malformed",
      "SIWE message is missing an address",
    );
  }

  const messageAddress = getAddress(fields.address);

  if (client) {
    const isValid = await verifySiweMessage(client, {
      message,
      signature,
      time,
    });

    if (!isValid) {
      throw new SiweVerificationError("bad_signature");
    }

    return { address: messageAddress, fields };
  }

  let recovered: Address;
  try {
    recovered = await recoverMessageAddress({ message, signature });
  } catch {
    // A malformed/tampered signature can make ECDSA recovery itself throw
    // (e.g. an invalid curve point) rather than merely recover a mismatched
    // address. Either outcome means the signature is inauthentic.
    throw new SiweVerificationError("bad_signature");
  }

  if (getAddress(recovered) !== messageAddress) {
    throw new SiweVerificationError("bad_signature");
  }

  return { address: messageAddress, fields };
};

export interface VerifySiweParams {
  message: string;
  signature: `0x${string}`;
  store: NonceStore;
  /**
   * Domain(s) the SIWE message may be bound to. Pass an array when the same
   * API serves multiple frontend hosts (e.g. whitelabel deployments); the
   * message's `domain` field must match one of them exactly.
   */
  expectedDomain: string | string[];
  expectedChainId: number;
  client?: Client;
  time?: Date;
}

/**
 * Store-aware SIWE verification: authenticity (via `verifySiweSignature`)
 * followed by domain/chainId/expiry checks, and finally an atomic
 * `store.consume(nonce)` as the last gate. The nonce is NOT consumed if any
 * earlier check fails, so a bad signature or stale message never burns a
 * valid nonce.
 */
export const verifySiwe = async (
  params: VerifySiweParams,
): Promise<VerifiedSiwe> => {
  const { message, signature, store, expectedDomain, expectedChainId } = params;
  const time = params.time ?? new Date();

  const allowedDomains = Array.isArray(expectedDomain)
    ? expectedDomain
    : [expectedDomain];

  // An empty allowlist is a server misconfiguration, not a user auth failure:
  // throw a plain Error so it surfaces as a 5xx instead of masquerading as 401.
  if (allowedDomains.length === 0) {
    throw new Error("verifySiwe: expectedDomain must not be empty");
  }

  const { address, fields } = await verifySiweSignature({
    message,
    signature,
    client: params.client,
    time,
  });

  if (!fields.domain || !allowedDomains.includes(fields.domain)) {
    throw new SiweVerificationError("invalid_message");
  }

  const isValidMessage = validateSiweMessage({
    message: fields,
    domain: fields.domain,
    time,
  });

  if (!isValidMessage) {
    throw new SiweVerificationError("invalid_message");
  }

  if (fields.chainId !== expectedChainId) {
    throw new SiweVerificationError("wrong_chain");
  }

  if (!fields.nonce) {
    throw new SiweVerificationError("malformed", "SIWE message has no nonce");
  }

  const consumed = await store.consume(fields.nonce);

  if (!consumed) {
    throw new SiweVerificationError("nonce");
  }

  return { address, fields };
};
