import { OpenAPIHono } from "@hono/zod-openapi";
import { vi } from "vitest";
import { type CacheStore, cacheMiddleware, STALE_GRACE_SECONDS } from "./cache";

// ---------------------------------------------------------------------------
// Fake Redis
// ---------------------------------------------------------------------------

class FakeRedis implements CacheStore {
  store = new Map<string, { value: string; ttl?: number }>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key)?.value ?? null;
  }

  async set(
    key: string,
    value: string,
    options?: { EX: number },
  ): Promise<string> {
    this.store.set(key, { value, ttl: options?.EX });
    return "OK";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultHandler = (c: import("hono").Context) => {
  c.header("Cache-Control", "public, max-age=60");
  return c.json({ ok: true }, 200);
};

/** Builds a minimal Hono app wired with the cache middleware and one GET route. */
function buildApp(
  redis: CacheStore,
  handler: (
    c: import("hono").Context,
  ) => Response | Promise<Response> = defaultHandler,
  daoApis: Map<string, string> = new Map(),
): OpenAPIHono {
  const app = new OpenAPIHono();
  app.use("*", cacheMiddleware(redis, daoApis));
  app.get("/test", handler);
  return app;
}

async function readResponse(res: Response) {
  return {
    status: res.status,
    cacheStatus: res.headers.get("Cache-Status"),
    cacheControl: res.headers.get("Cache-Control"),
    body: await res.text(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("cacheMiddleware", () => {
  let redis: FakeRedis;

  beforeEach(() => {
    redis = new FakeRedis();
  });

  // -------------------------------------------------------------------------
  // Cache HIT
  // -------------------------------------------------------------------------

  it("returns cached response with Cache-Status: Redis; hit on cache hit", async () => {
    const handler = vi.fn((c: import("hono").Context) => {
      c.header("Cache-Control", "public, max-age=60");
      return c.json({ ok: true }, 200);
    });
    const app = buildApp(redis, handler);

    await app.request("/test"); // first request: MISS — primes the cache
    const res = await app.request("/test"); // second request: HIT

    expect(await readResponse(res)).toEqual({
      status: 200,
      cacheStatus: "Redis; hit",
      cacheControl: "public, max-age=60",
      body: '{"ok":true}',
    });
    // Handler was only invoked for the first (MISS) request.
    expect(handler).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // Redis read error → fail open
  // -------------------------------------------------------------------------

  it("fails open when Redis throws on read (calls next() normally)", async () => {
    vi.spyOn(redis, "get").mockRejectedValueOnce(
      new Error("connection refused"),
    );

    const app = buildApp(redis);

    const res = await app.request("/test");

    expect(await readResponse(res)).toEqual({
      status: 200,
      cacheStatus: null,
      cacheControl: "public, max-age=60",
      body: '{"ok":true}',
    });
  });

  // -------------------------------------------------------------------------
  // Redis write error → fail open
  // -------------------------------------------------------------------------

  it("fails open when Redis throws on write (response still returned)", async () => {
    vi.spyOn(redis, "set").mockRejectedValueOnce(new Error("write error"));

    const app = buildApp(redis);

    const res = await app.request("/test");

    expect(await readResponse(res)).toEqual({
      status: 200,
      cacheStatus: null,
      cacheControl: "public, max-age=60",
      body: '{"ok":true}',
    });
  });

  // -------------------------------------------------------------------------
  // Non-2xx → not cached
  // -------------------------------------------------------------------------

  it("does not cache non-2xx responses", async () => {
    const app = buildApp(redis, (c) => {
      c.header("Cache-Control", "public, max-age=60");
      return c.json({ error: "not found" }, 404);
    });

    await app.request("/test");

    expect(redis.store.size).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Missing Cache-Control → not cached
  // -------------------------------------------------------------------------

  it("does not cache responses without a Cache-Control header", async () => {
    const app = buildApp(redis, (c) => c.json({ ok: true }, 200));

    await app.request("/test");

    expect(redis.store.size).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Stale-on-error
  // -------------------------------------------------------------------------

  describe("stale entries", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(0);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** Primes the cache and moves past the TTL so the entry is stale. */
    async function primeStale(handler = defaultHandler) {
      const app = buildApp(redis, handler);
      await app.request("/test");
      vi.setSystemTime(60_001);
    }

    it("keeps entries in Redis for the grace period beyond max-age", async () => {
      const app = buildApp(redis);

      await app.request("/test");

      const [entry] = redis.store.values();
      expect(entry?.ttl).toBe(60 + STALE_GRACE_SECONDS);
    });

    it("revalidates a stale entry against the upstream when it is healthy", async () => {
      await primeStale();
      const handler = vi.fn((c: import("hono").Context) => {
        c.header("Cache-Control", "public, max-age=60");
        return c.json({ ok: "fresh" }, 200);
      });
      const app = buildApp(redis, handler);

      const res = await app.request("/test");

      expect(handler).toHaveBeenCalledOnce();
      expect(await readResponse(res)).toMatchObject({
        status: 200,
        cacheStatus: null,
        body: '{"ok":"fresh"}',
      });
    });

    it("serves the stale entry when the upstream returns 5xx", async () => {
      await primeStale();
      const app = buildApp(redis, (c) =>
        c.json({ error: "upstream down" }, 503),
      );

      const res = await app.request("/test");

      expect(await readResponse(res)).toEqual({
        status: 200,
        cacheStatus: "Redis; stale",
        cacheControl: "no-cache",
        body: '{"ok":true}',
      });
    });

    it("serves the stale entry when the handler throws (e.g. circuit open)", async () => {
      await primeStale();
      const app = buildApp(redis, () => {
        throw new Error("circuit open");
      });

      const res = await app.request("/test");

      expect(await readResponse(res)).toMatchObject({
        status: 200,
        cacheStatus: "Redis; stale",
        body: '{"ok":true}',
      });
    });

    it("does not mask upstream errors when there is no stale entry", async () => {
      const app = buildApp(redis, (c) =>
        c.json({ error: "upstream down" }, 503),
      );

      const res = await app.request("/test");

      expect(res.status).toBe(503);
    });

    it("treats entries written without expiresAt as fresh", async () => {
      await redis.set(
        new URL("/test", "http://localhost").toString(),
        JSON.stringify({
          body: '{"legacy":true}',
          status: 200,
          contentType: "application/json",
          cacheControl: "public, max-age=60",
        }),
        { EX: 60 },
      );
      const handler = vi.fn(defaultHandler);
      const app = buildApp(redis, handler);

      const res = await app.request("/test");

      expect(handler).not.toHaveBeenCalled();
      expect(await readResponse(res)).toMatchObject({
        cacheStatus: "Redis; hit",
        body: '{"legacy":true}',
      });
    });
  });
});
