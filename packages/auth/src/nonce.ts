import { generateSiweNonce } from "viem/siwe";

/**
 * Generates a fresh SIWE nonce (viem's `generateSiweNonce`).
 */
export const generateNonce = (): string => generateSiweNonce();

/**
 * Pluggable storage for SIWE nonces.
 *
 * `consume` MUST be implemented as an atomic single-use test-and-delete: it
 * must return `true` to exactly one caller for a given nonce, even under
 * concurrent invocations, and `false` to every other caller (unknown,
 * already-consumed, or expired nonce). Non-atomic implementations (e.g. a
 * naive `get` followed by a separate `delete`) are vulnerable to a
 * time-of-check-to-time-of-use race that allows a SIWE message to be replayed.
 */
export interface NonceStore {
  /**
   * Persist a nonce so it can later be validated exactly once via `consume`.
   * @param ttlMs optional time-to-live in milliseconds after which the nonce
   * is no longer considered valid, even if never consumed.
   */
  issue(nonce: string, ttlMs?: number): Promise<void>;

  /**
   * Atomically test-and-delete the given nonce. Returns `true` only to the
   * single caller that removed it (i.e. the first and only successful
   * consumer); returns `false` for unknown, already-consumed, or expired
   * nonces.
   */
  consume(nonce: string): Promise<boolean>;
}
