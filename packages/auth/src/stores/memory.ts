import type { NonceStore } from "../nonce.js";

export interface MemoryNonceStoreOptions {
  /** Default TTL (ms) applied when `issue` is called without an explicit ttl. */
  defaultTtlMs?: number;
  /**
   * Maximum number of outstanding nonces. Once reached (after reclaiming
   * expired entries), `issue` throws rather than evicting a live nonce.
   */
  maxEntries?: number;
}

/**
 * In-memory `NonceStore` reference implementation.
 *
 * Intended for development, tests, and single-instance deployments only —
 * state is not shared across processes/instances, so it is unsuitable for
 * multi-instance production deployments (nonces issued on one instance won't
 * be consumable on another). Ship a durable store (Redis/Postgres) for
 * production multi-instance use, preserving the atomic `consume` contract.
 */
export const memoryNonceStore = (
  options: MemoryNonceStoreOptions = {},
): NonceStore => {
  const { defaultTtlMs = 300_000, maxEntries = 10_000 } = options;
  const entries = new Map<string, number>();

  const sweepExpired = (now: number): void => {
    for (const [nonce, expiresAt] of entries) {
      if (expiresAt <= now) {
        entries.delete(nonce);
      }
    }
  };

  return {
    async issue(nonce, ttlMs) {
      const now = Date.now();
      sweepExpired(now);

      // Do NOT evict live (unconsumed) nonces to make room — that would let an
      // attacker flooding `/auth/nonce` knock out honest users' outstanding
      // nonces (login DoS). Once expired entries are reclaimed and we are still
      // at capacity, fail loud so the route surfaces a 5xx (alertable) instead
      // of silently dropping a valid nonce. Consumers MUST rate-limit the nonce
      // endpoint and/or use a durable store for multi-instance production.
      if (entries.size >= maxEntries) {
        throw new Error(
          "memoryNonceStore is at capacity; rate-limit the nonce endpoint or raise maxEntries",
        );
      }

      entries.set(nonce, now + (ttlMs ?? defaultTtlMs));
    },

    async consume(nonce) {
      const expiresAt = entries.get(nonce);
      if (expiresAt === undefined) {
        return false;
      }

      // No `await` between the read and the delete below: in single-threaded
      // JS this makes the test-and-delete atomic with respect to other
      // `consume` calls, satisfying the `NonceStore.consume` contract.
      entries.delete(nonce);

      return expiresAt > Date.now();
    },
  };
};
