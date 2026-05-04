import { getAddress } from "viem";
import type { Address } from "viem";

export type RelayOperation = "vote" | "delegation";

export interface IncrementIfAllowedParams {
  daoName: string;
  governorAddress: Address;
  address: Address;
  operation: RelayOperation;
  maxPerDay: number;
}

export interface RateLimitStorage {
  incrementIfAllowed(params: IncrementIfAllowedParams): Promise<boolean>;
}

export interface RedisClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

const DAY_MS = 86_400_000;
const DAY_SECONDS = 86400;

/**
 * Builds a stable Redis key scoped to a DAO, governor, wallet address, and operation type.
 * Addresses are checksummed via EIP-55 to prevent key collisions from mixed-case inputs.
 *
 * Example: `"MyDAO:0xAbc...123:0xDef...456:vote"`
 */
export function buildKey(
  daoName: string,
  governorAddress: Address,
  address: Address,
  operation: RelayOperation,
): string {
  return `${daoName}:${getAddress(governorAddress)}:${getAddress(address)}:${operation}`;
}

/**
 * Appends a UTC day bucket suffix to a base key, derived from a Unix timestamp in milliseconds.
 * Uses a fixed window aligned to UTC midnight — the counter resets at 00:00 UTC, not 24h after
 * the first request.
 *
 * Example: `"MyDAO:0xAbc...:vote:d:19830"` (day 19830 since epoch)
 */
export function dailyKey(base: string, timestampMs: number): string {
  return `${base}:d:${Math.floor(timestampMs / DAY_MS)}`;
}

/** Redis-backed rate limit store using a daily fixed-window counter per (DAO, governor, address, operation) tuple. */
export class RedisRateLimitStorage implements RateLimitStorage {
  constructor(private redis: RedisClient) {}

  /**
   * Atomically increments the daily counter for the given params and returns whether the
   * operation is within the allowed limit.
   *
   * On the first increment of the day, a TTL of 24 h is set so keys self-expire.
   * Returns `false` once the count exceeds `maxPerDay`.
   */
  async incrementIfAllowed({
    daoName,
    governorAddress,
    address,
    operation,
    maxPerDay,
  }: IncrementIfAllowedParams): Promise<boolean> {
    const base = buildKey(daoName, governorAddress, address, operation);
    const dayKey = dailyKey(base, Date.now());

    const dayCount = await this.redis.incr(dayKey);
    if (dayCount === 1) await this.redis.expire(dayKey, DAY_SECONDS);

    return dayCount <= maxPerDay;
  }
}
