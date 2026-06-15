import type { Address } from "viem";

import type {
  RateLimitStorage,
  RelayOperation,
} from "@/repository/rate-limit-storage";
import { Errors } from "@/errors";

export type { RelayOperation };

/** Fallback per-operation monthly relay limit, used when an operation's env override is unset. */
export const DEFAULT_RELAY_LIMIT = 3;

/**
 * Resolves the per-operation monthly limits, applying DEFAULT_RELAY_LIMIT to any operation whose
 * env override is unset. Pure function — the single source of the fallback rule.
 */
export function resolveRelayLimits(input: {
  votes?: number;
  delegations?: number;
}): Record<RelayOperation, number> {
  return {
    vote: input.votes ?? DEFAULT_RELAY_LIMIT,
    delegation: input.delegations ?? DEFAULT_RELAY_LIMIT,
  };
}

export interface IRateLimiter {
  assertWithinLimit(address: Address, operation: RelayOperation): Promise<void>;
}

interface RateLimiterConfig {
  daoName: string;
  governorAddress: Address;
  maxPerAddressPerDay: number;
}

export class RateLimiter implements IRateLimiter {
  constructor(
    private store: RateLimitStorage,
    private config: RateLimiterConfig,
  ) {}

  async assertWithinLimit(
    address: Address,
    operation: RelayOperation,
  ): Promise<void> {
    let granted: boolean;
    try {
      granted = await this.store.incrementIfAllowed({
        daoName: this.config.daoName,
        governorAddress: this.config.governorAddress,
        address,
        operation,
        maxPerMonth: this.config.maxPerAddressPerDay,
      });
    } catch {
      throw Errors.RATE_LIMITER_UNAVAILABLE();
    }

    if (!granted) {
      throw Errors.RATE_LIMITED();
    }
  }
}
