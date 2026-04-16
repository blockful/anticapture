import { type Address, getAddress } from "viem";

import { Errors } from "@/errors";

interface RateLimiterConfig {
  maxPerAddressPerDay: number;
  maxPerAddressPerHour: number;
}

export class RateLimiter {
  // address → list of timestamps (ms)
  private requests = new Map<Address, number[]>();

  constructor(private config: RateLimiterConfig) {}

  /**
   * Read-only check — call before validation to fail fast.
   * Does NOT record usage. Call recordUsage() after successful tx submission.
   */
  checkAllowed(address: Address): void {
    const now = Date.now();
    const key = getAddress(address);
    const timestamps = this.requests.get(key) ?? [];

    // Prune entries older than 24h
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const recent = timestamps.filter((t) => t > dayAgo);

    if (recent.length >= this.config.maxPerAddressPerDay) {
      throw Errors.RATE_LIMITED();
    }

    const hourAgo = now - 60 * 60 * 1000;
    const lastHour = recent.filter((t) => t > hourAgo);
    if (lastHour.length >= this.config.maxPerAddressPerHour) {
      throw Errors.RATE_LIMITED();
    }
  }

  /**
   * Record a successful relay.
   */
  recordUsage(address: Address): void {
    const now = Date.now();
    const key = getAddress(address);
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const timestamps = (this.requests.get(key) ?? []).filter((t) => t > dayAgo);
    timestamps.push(now);
    this.requests.set(key, timestamps);
  }

  /** For testing: reset all state */
  reset(): void {
    this.requests.clear();
  }
}
