import Redis from "ioredis";
import { CacheServiceInterface } from "./cache.service.interface";
import { getApiConfig } from "@/api/config/config";

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
    // seconds to expire is the difference between the end of the day and the current time
    const secondsToExpire = Math.trunc(
      new Date().setHours(23, 59, 59, 999) / 1000 - Date.now() / 1000,
    );
    //This command will set the key with the value and the expiration time in seconds
    await this.redis.set(key, value, "EX", secondsToExpire);
  }
}
const config = getApiConfig();
export const redisService = config.redisUrl
  ? new RedisService(config.redisUrl)
  : undefined;
