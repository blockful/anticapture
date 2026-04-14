import { createClient } from "redis";

/**
 * Creates a Redis client for the given URL.
 * Connects asynchronously — errors are logged but do not block startup.
 */
export function createRedisClient(url: string) {
  const client = createClient({ url });

  client.on("connect", () => {
    console.log("[redis] connected");
  });

  client.on("reconnecting", () => {
    console.log("[redis] reconnecting");
  });

  client.on("error", (err: Error) => {
    console.error(`[redis] error: ${err.message}`);
  });

  // Connect in the background — startup is not blocked.
  client.connect().catch((err: Error) => {
    console.error(`[redis] initial connection failed: ${err.message}`);
  });

  return client;
}
