import type { Address } from "viem";

import { createLogger, type Logger } from "@anticapture/observability";

import type { RateLimitStorage } from "@/repository/rate-limit-storage";
import type {
  RelayerStatusChecks,
  RelayerStatusReason,
  RelayerStatusResponse,
} from "@/schemas/status";
import type { ChainProbe } from "@/services/chain/chain-probe";

import type { RelayOutcomeTracker } from "./relay-outcome-tracker";

/** Upper bound on each check, so one hung dependency cannot hold the answer. */
export const STATUS_CHECK_TIMEOUT_MS = 3_000;

/** How long an answer is reused, so polling dashboards cannot hammer the RPC. */
export const STATUS_CACHE_TTL_MS = 10_000;

/**
 * A latest block older than this means the RPC stopped following the chain:
 * mainnet produces one every 12 seconds.
 */
export const MAX_BLOCK_AGE_MS = 120_000;

/**
 * How long the wallet's pending nonce may sit ahead of its mined nonce,
 * without the mined one moving, before its transactions count as stuck.
 */
export const STUCK_PENDING_AFTER_MS = 5 * 60_000;

export interface RelayerStatusDeps {
  /** The GASLESS_PAUSED kill switch. */
  paused: boolean;
  /** The chain the relayer signs for (CHAIN_ID). */
  chainId: number;
  chain: ChainProbe;
  relayerAddress: Address;
  /** Below this native balance the wallet counts as underfunded. */
  thresholdWei: bigint;
  rateLimitStorage: Pick<RateLimitStorage, "ping">;
  relayOutcomes: Pick<RelayOutcomeTracker, "isFailing">;
}

interface BalanceCheck {
  state: RelayerStatusChecks["balance"];
  wei?: bigint;
}

/**
 * Rejects once `ms` elapse. viem retries a failing RPC for longer than that,
 * and the Redis client queues commands while it reconnects, so neither would
 * fail fast on its own. The abandoned call keeps running in the background.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`check timed out after ${ms}ms`)),
      ms,
    );
  });
  void promise.catch(() => {
    // After the race settles on the timeout, a late rejection must not crash
    // the process.
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Answers "can the gasless relayer be used right now?" for every failure the
 * relayer can detect in itself, so the dashboard falls back to a regular
 * wallet transaction instead of letting a user sign a relay that will not
 * land. Never throws: a check that fails or hangs is itself the answer.
 */
export class RelayerStatusService {
  private cached: {
    at: number;
    status: Promise<RelayerStatusResponse>;
  } | null = null;

  // When the pending nonce was first seen ahead of the mined one, and the
  // mined nonce at that moment. A gap whose mined nonce moves on is a busy
  // queue draining rather than a stuck one, so it restarts the clock.
  private pendingGap: { since: number; latestNonce: number } | null = null;

  // Reasons from the previous run, so only changes of availability are
  // logged rather than every poll of a degraded relayer.
  private lastReasons = "";

  constructor(
    private deps: RelayerStatusDeps,
    private logger: Logger = createLogger("relayer-status"),
  ) {}

  /**
   * Concurrent callers inside the cache window share one run, including the
   * one still in flight, so the checks never overlap.
   */
  async getStatus(): Promise<RelayerStatusResponse> {
    const now = Date.now();
    if (this.cached && now - this.cached.at < STATUS_CACHE_TTL_MS) {
      return this.cached.status;
    }
    const status = this.runChecks(now);
    this.cached = { at: now, status };
    return status;
  }

  private async runChecks(now: number): Promise<RelayerStatusResponse> {
    const [rpc, balance, rateLimiter, pendingTransactions] = await Promise.all([
      this.checkRpc(now),
      this.checkBalance(),
      this.checkRateLimiter(),
      this.checkPendingTransactions(now),
    ]);
    const checks: RelayerStatusChecks = {
      paused: this.deps.paused,
      rpc,
      balance: balance.state,
      rateLimiter,
      pendingTransactions,
      recentRelays: this.deps.relayOutcomes.isFailing() ? "failing" : "ok",
    };
    const reasons = reasonsFor(checks);
    this.logAvailabilityChange(reasons);

    return {
      available: reasons.length === 0,
      reasons,
      checks,
      ...(balance.wei !== undefined
        ? { balanceWei: balance.wei.toString() }
        : {}),
      thresholdWei: this.deps.thresholdWei.toString(),
      checkedAt: new Date(now).toISOString(),
    };
  }

  private async checkRpc(now: number): Promise<RelayerStatusChecks["rpc"]> {
    try {
      const [chainId, blockTimestamp] = await withTimeout(
        Promise.all([
          this.deps.chain.chainId(),
          this.deps.chain.latestBlockTimestamp(),
        ]),
        STATUS_CHECK_TIMEOUT_MS,
      );
      if (chainId !== this.deps.chainId) return "wrong_chain";
      return now - Number(blockTimestamp) * 1000 > MAX_BLOCK_AGE_MS
        ? "stale"
        : "ok";
    } catch {
      return "unavailable";
    }
  }

  private async checkBalance(): Promise<BalanceCheck> {
    try {
      const wei = await withTimeout(
        this.deps.chain.balance(this.deps.relayerAddress),
        STATUS_CHECK_TIMEOUT_MS,
      );
      return { state: wei >= this.deps.thresholdWei ? "ok" : "low", wei };
    } catch {
      return { state: "unknown" };
    }
  }

  private async checkRateLimiter(): Promise<
    RelayerStatusChecks["rateLimiter"]
  > {
    try {
      await withTimeout(
        this.deps.rateLimitStorage.ping(),
        STATUS_CHECK_TIMEOUT_MS,
      );
      return "ok";
    } catch {
      return "unavailable";
    }
  }

  private async checkPendingTransactions(
    now: number,
  ): Promise<RelayerStatusChecks["pendingTransactions"]> {
    let pending: number;
    let latest: number;
    try {
      [pending, latest] = await withTimeout(
        Promise.all([
          this.deps.chain.nonce(this.deps.relayerAddress, "pending"),
          this.deps.chain.nonce(this.deps.relayerAddress, "latest"),
        ]),
        STATUS_CHECK_TIMEOUT_MS,
      );
    } catch {
      // A failed read is no evidence the gap closed, so the clock keeps
      // running; the RPC check already reports an RPC that is down.
      return "unknown";
    }

    if (pending <= latest) {
      this.pendingGap = null;
      return "ok";
    }
    if (this.pendingGap?.latestNonce !== latest) {
      this.pendingGap = { since: now, latestNonce: latest };
    }
    return now - this.pendingGap.since >= STUCK_PENDING_AFTER_MS
      ? "stuck"
      : "ok";
  }

  private logAvailabilityChange(reasons: RelayerStatusReason[]): void {
    const key = reasons.join(",");
    if (key === this.lastReasons) return;
    this.lastReasons = key;
    if (reasons.length > 0) {
      this.logger.warn({ reasons }, "gasless relaying unavailable");
    } else {
      this.logger.info("gasless relaying available again");
    }
  }
}

function reasonsFor(checks: RelayerStatusChecks): RelayerStatusReason[] {
  const reasons: RelayerStatusReason[] = [];
  if (checks.paused) reasons.push("PAUSED");
  if (checks.rpc === "unavailable") reasons.push("RPC_UNAVAILABLE");
  if (checks.rpc === "wrong_chain") reasons.push("WRONG_CHAIN");
  if (checks.rpc === "stale") reasons.push("CHAIN_STALE");
  if (checks.balance === "low") reasons.push("LOW_BALANCE");
  if (checks.balance === "unknown") reasons.push("BALANCE_UNKNOWN");
  if (checks.rateLimiter === "unavailable") {
    reasons.push("RATE_LIMITER_UNAVAILABLE");
  }
  if (checks.pendingTransactions === "stuck") {
    reasons.push("PENDING_TRANSACTIONS_STUCK");
  }
  if (checks.recentRelays === "failing") reasons.push("RECENT_RELAY_FAILURES");
  return reasons;
}
