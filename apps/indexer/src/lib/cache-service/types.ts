import { RedisClientType } from "redis";

export interface CacheServiceInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
}
