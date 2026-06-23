import { getAddress } from "viem";
import type { Address } from "viem";

export type RelayOperation = "vote" | "delegation";

export interface IncrementIfAllowedParams {
  daoName: string;
  governorAddress: Address;
  address: Address;
  operation: RelayOperation;
  maxPerMonth: number;
}

export interface GetCountParams {
  daoName: string;
  governorAddress: Address;
  address: Address;
  operation: RelayOperation;
}

export interface RateLimitStorage {
  incrementIfAllowed(params: IncrementIfAllowedParams): Promise<boolean>;
  getCount(params: GetCountParams): Promise<number>;
}

export interface RedisClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
}

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
 * Appends a UTC calendar-month bucket suffix to a base key, derived from a Unix timestamp in
 * milliseconds. Uses a fixed window aligned to the first of the month — the counter resets at
 * 00:00 UTC on the 1st, not 30 days after the first request.
 *
 * Example: `"MyDAO:0xAbc...:vote:m:2026-06"`
 */
export function monthlyKey(base: string, timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${base}:m:${year}-${month}`;
}

/**
 * Seconds remaining until 00:00 UTC on the first day of the next month, relative to the given
 * timestamp. Used as the TTL on first increment so the bucket self-expires exactly at the month
 * boundary.
 */
export function secondsUntilNextUtcMonth(timestampMs: number): number {
  const date = new Date(timestampMs);
  const nextMonthMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    1,
  );
  return Math.ceil((nextMonthMs - timestampMs) / 1000);
}

/** Redis-backed rate limit store using a monthly fixed-window counter per (DAO, governor, address, operation) tuple. */
export class RedisRateLimitStorage implements RateLimitStorage {
  constructor(private redis: RedisClient) {}

  /**
   * Atomically increments the monthly counter for the given params and returns whether the
   * operation is within the allowed limit.
   *
   * On the first increment of the month, a TTL is set so the key expires at the next UTC month
   * boundary. Returns `false` once the count exceeds `maxPerMonth`.
   */
  async incrementIfAllowed({
    daoName,
    governorAddress,
    address,
    operation,
    maxPerMonth,
  }: IncrementIfAllowedParams): Promise<boolean> {
    const base = buildKey(daoName, governorAddress, address, operation);
    const now = Date.now();
    const monthKey = monthlyKey(base, now);

    const monthCount = await this.redis.incr(monthKey);
    if (monthCount === 1) {
      await this.redis.expire(monthKey, secondsUntilNextUtcMonth(now));
    }

    return monthCount <= maxPerMonth;
  }

  /**
   * Reads the current monthly counter without incrementing. Returns 0 if no calls have been made
   * in the current UTC-month window (or if the key has expired).
   */
  async getCount({
    daoName,
    governorAddress,
    address,
    operation,
  }: GetCountParams): Promise<number> {
    const base = buildKey(daoName, governorAddress, address, operation);
    const monthKey = monthlyKey(base, Date.now());

    const raw = await this.redis.get(monthKey);
    return raw === null ? 0 : Number(raw);
  }
}
