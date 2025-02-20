import Redis from "ioredis";
import { CacheServiceInterface } from "./cache.service.interface";

export class RedisService implements CacheServiceInterface<string> {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redis.get(key);
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    await this.redis.set(key, value);
  }
}
