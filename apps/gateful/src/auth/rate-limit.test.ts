import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";

import { type RateLimitStore, rateLimitMiddleware } from "./rate-limit";
import type { AuthContext } from "./token-auth";

class FakeRateLimitStore implements RateLimitStore {
  counters = new Map<string, number>();
  expirations = new Map<string, number>();

  async incr(key: string): Promise<number> {
    const next = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, next);
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.expirations.set(key, seconds);
    return 1;
  }
}

const AUTH: AuthContext = {
  tokenId: "11111111-1111-1111-1111-111111111111",
  tenant: "uniswap",
  rateLimitPerMin: 3,
};

function buildApp(store?: RateLimitStore, auth: AuthContext | null = AUTH) {
  const app = new OpenAPIHono();
  if (auth) {
    app.use("*", async (c, next) => {
      c.set("auth", auth);
      await next();
    });
  }
  app.use("*", rateLimitMiddleware(store));
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
}

describe("rateLimitMiddleware", () => {
  it("allows requests under the limit and sets a window expiry", async () => {
    const store = new FakeRateLimitStore();
    const app = buildApp(store);

    for (let i = 0; i < 3; i++) {
      const res = await app.request("/test");
      expect(res.status).toBe(200);
    }
    expect([...store.expirations.values()]).toEqual([120]);
  });

  it("returns 429 with Retry-After once the limit is exceeded", async () => {
    const app = buildApp(new FakeRateLimitStore());

    for (let i = 0; i < 3; i++) await app.request("/test");
    const res = await app.request("/test");

    expect(res.status).toBe(429);
    const retryAfter = Number(res.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("skips limiting when there is no auth context (public/legacy)", async () => {
    const store = new FakeRateLimitStore();
    const app = buildApp(store, null);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(store.counters.size).toBe(0);
  });

  it("fails open without a store", async () => {
    const res = await buildApp(undefined).request("/test");
    expect(res.status).toBe(200);
  });

  it("fails open when the store errors", async () => {
    const broken: RateLimitStore = {
      incr: () => Promise.reject(new Error("redis down")),
      expire: () => Promise.reject(new Error("redis down")),
    };
    const res = await buildApp(broken).request("/test");
    expect(res.status).toBe(200);
  });
});
