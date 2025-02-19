import { createClient, RedisClientType } from "redis";
import { CacheServiceInterface } from "./types";

export class RedisCacheService implements CacheServiceInterface {
  private redis: RedisClientType;
  constructor(redisUrl: string | undefined) {
    this.redis = createClient({
      url: redisUrl,
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      await this.redis.connect();
      const value = await this.redis.get(key);
      await this.redis.disconnect();
      return value;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async set<T>(key: string, value: T) {
    try {
      await this.redis.connect();
      await this.redis.set(key, value);
      await this.redis.disconnect();
    } catch (error) {
      console.error(error);
      return;
    }
  }
}
