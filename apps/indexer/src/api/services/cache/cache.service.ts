import { createClient, RedisClientType } from "redis";
import { CacheServiceInterface } from "./cache.service.interface";

export class RedisService implements CacheServiceInterface<string> {
  private redis: RedisClientType;

  constructor(redisUrl: string) {
    this.redis = createClient({ url: redisUrl });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redis.get(key);
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    await this.redis.set(key, value);
  }
}
