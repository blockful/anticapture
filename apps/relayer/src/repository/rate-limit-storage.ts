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

export function buildKey(
  daoName: string,
  governorAddress: Address,
  address: Address,
  operation: RelayOperation,
): string {
  return `${daoName}:${getAddress(governorAddress)}:${getAddress(address)}:${operation}`;
}

export function dailyKey(base: string, timestampMs: number): string {
  return `${base}:d:${Math.floor(timestampMs / DAY_MS)}`;
}

export class RedisRateLimitStorage implements RateLimitStorage {
  constructor(private redis: RedisClient) {}

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
