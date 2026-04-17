import type { Address } from "viem";

import type {
  RateLimitStorage,
  RelayOperation,
} from "@/repository/rate-limit-storage";
import { Errors } from "@/errors";

export type { RelayOperation };

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
        maxPerDay: this.config.maxPerAddressPerDay,
      });
    } catch {
      throw Errors.RATE_LIMITER_UNAVAILABLE();
    }

    if (!granted) {
      throw Errors.RATE_LIMITED();
    }
  }
}
