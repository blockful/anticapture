import type { RelayerSigner } from "@/signer/types";

/** Broadcast failures, inside one window, that mark recent relays as failing. */
export const RECENT_FAILURE_THRESHOLD = 3;

/**
 * How close together those failures must land, and how long the failing
 * state outlives the latest of them when nothing succeeds in between.
 */
export const RECENT_FAILURE_WINDOW_MS = 10 * 60_000;

/**
 * Remembers whether the relayer wallet's recent broadcasts keep failing,
 * which no single probe of the chain can show: a node that rejects every
 * transaction for a nonce or fee reason, a key that no longer controls the
 * funds. Only broadcasts count. A request refused before it reached the
 * signer (bad signature, rate limit, simulation revert, voting power) says
 * nothing about the wallet, so it is neither a failure nor a success here.
 *
 * Kept in memory on purpose: a restart, which is how a rotated key or a
 * fixed RPC reaches the relayer, should start from a clean slate.
 */
export class RelayOutcomeTracker {
  // Failures since the last success, pruned to the window that ends at the
  // latest one, so a slow trickle of unrelated failures never adds up.
  private failures: number[] = [];

  recordSuccess(): void {
    this.failures = [];
  }

  recordFailure(): void {
    const now = Date.now();
    this.failures = [
      ...this.failures.filter((at) => now - at < RECENT_FAILURE_WINDOW_MS),
      now,
    ];
  }

  isFailing(): boolean {
    const latest = this.failures.at(-1);
    return (
      latest !== undefined &&
      Date.now() - latest < RECENT_FAILURE_WINDOW_MS &&
      this.failures.length >= RECENT_FAILURE_THRESHOLD
    );
  }
}

/**
 * Wraps the relayer signer so every broadcast reports its outcome. Votes,
 * delegations and proposal enactment all send through this one signer, so
 * none of them has to remember to report, and a failure is recorded whatever
 * it becomes upstream: an InsufficientFundsError still counts here even
 * though the services answer it as 503 RELAYER_LOW_BALANCE.
 */
export function trackBroadcasts(
  signer: RelayerSigner,
  tracker: Pick<RelayOutcomeTracker, "recordSuccess" | "recordFailure">,
): RelayerSigner {
  return {
    getAddress: () => signer.getAddress(),

    async sendTransaction(tx) {
      try {
        const hash = await signer.sendTransaction(tx);
        tracker.recordSuccess();
        return hash;
      } catch (err) {
        tracker.recordFailure();
        throw err;
      }
    },
  };
}
