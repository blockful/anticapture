import { RedisClientType } from "redis";

export interface CacheServiceInterface {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any): Promise<void>;
}
