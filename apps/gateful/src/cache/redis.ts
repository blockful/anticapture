import { createClient } from "redis";

import { logger } from "../logger.js";

/**
 * Creates a Redis client for the given URL.
 * Connects asynchronously — errors are logged but do not block startup.
 */
export function createRedisClient(url: string) {
  const client = createClient({ url });

  client.on("connect", () => {
    logger.info("redis connected");
  });

  client.on("reconnecting", () => {
    logger.info("redis reconnecting");
  });

  client.on("error", (err: Error) => {
    logger.error({ err }, "redis error");
  });

  // Connect in the background — startup is not blocked.
  client.connect().catch((err: Error) => {
    logger.error({ err }, "redis initial connection failed");
  });

  return client;
}
