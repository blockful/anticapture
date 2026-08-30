/**
 * Server-only fixed-window rate limiter for API routes.
 *
 * On Vercel, concurrent function instances do not share module memory and
 * cold starts discard it, so an in-memory counter alone cannot bound a burst
 * distributed across instances. When an Upstash-compatible Redis REST
 * endpoint is configured (Vercel KV or a Marketplace Redis integration:
 * KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/
 * UPSTASH_REDIS_REST_TOKEN), counters live there and are shared across every
 * instance. The in-memory map backs local dev and is the fallback if the
 * durable store is unreachable, preferring availability over a hard block.
 */

interface RateLimitOptions {
  /** Namespaces the counter, e.g. "request-feature:203.0.113.7". */
  key: string;
  windowSeconds: number;
  maxRequests: number;
}

/**
 * Bounds the durable-store round trip so a stalled Redis endpoint falls back
 * to the in-memory limiter instead of blocking the request until the
 * platform kills the function.
 */
const DURABLE_STORE_TIMEOUT_MS = 2000;

const memoryCounters = new Map<string, { count: number; resetAt: number }>();

const checkMemoryRateLimit = ({
  key,
  windowSeconds,
  maxRequests,
}: RateLimitOptions): boolean => {
  const now = Date.now();
  const record = memoryCounters.get(key);

  if (!record || now > record.resetAt) {
    memoryCounters.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

const checkDurableRateLimit = async ({
  key,
  windowSeconds,
  maxRequests,
}: RateLimitOptions): Promise<boolean | null> => {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  // Fixed window: the window start is part of the key, so INCR both counts
  // the request and creates the next window's counter atomically.
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const counterKey = `rate-limit:${key}:${window}`;

  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(DURABLE_STORE_TIMEOUT_MS),
      body: JSON.stringify([
        ["INCR", counterKey],
        ["EXPIRE", counterKey, String(windowSeconds)],
      ]),
    });
    if (!response.ok) {
      throw new Error(`rate limit store responded ${response.status}`);
    }
    const [first] = (await response.json()) as Array<{
      result?: number;
      error?: string;
    }>;
    if (typeof first?.result !== "number") {
      throw new Error(first?.error ?? "unexpected rate limit store response");
    }
    return first.result <= maxRequests;
  } catch (error) {
    console.error("Durable rate limit check failed:", error);
    return null;
  }
};

export const checkRateLimit = async (
  options: RateLimitOptions,
): Promise<boolean> => {
  const durable = await checkDurableRateLimit(options);
  if (durable !== null) return durable;
  return checkMemoryRateLimit(options);
};
