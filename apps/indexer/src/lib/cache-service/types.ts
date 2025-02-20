import { RedisClientType } from "redis";

export interface CacheServiceInterface<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
}
