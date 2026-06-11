import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it, vi } from "vitest";

import {
  type TokenCacheStore,
  hashBearerToken,
  tokenAuthMiddleware,
} from "./token-auth";
import type { AuthfulClient, TokenValidation } from "./authful-client";

class FakeRedis implements TokenCacheStore {
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

const VALID: TokenValidation = {
  valid: true,
  tokenId: "11111111-1111-1111-1111-111111111111",
  tenant: "uniswap",
  rateLimitPerMin: 600,
};

function fakeClient(impl: () => Promise<TokenValidation>) {
  return { validate: vi.fn(impl) } as unknown as AuthfulClient & {
    validate: ReturnType<typeof vi.fn>;
  };
}

function buildApp(client: AuthfulClient, cache?: TokenCacheStore) {
  const app = new OpenAPIHono();
  app.use(
    "*",
    tokenAuthMiddleware({
      client,
      cache,
      publicPaths: new Set(["/health"]),
    }),
  );
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.get("/protected", (c) => c.json({ tenant: c.get("auth")?.tenant }));
  return app;
}

const withBearer = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

describe("tokenAuthMiddleware", () => {
  it("lets public paths through without a token", async () => {
    const client = fakeClient(() => Promise.resolve(VALID));
    const res = await buildApp(client).request("/health");
    expect(res.status).toBe(200);
    expect(client.validate).not.toHaveBeenCalled();
  });

  it("rejects requests without a bearer token", async () => {
    const client = fakeClient(() => Promise.resolve(VALID));
    const res = await buildApp(client).request("/protected");
    expect(res.status).toBe(401);
    expect(client.validate).not.toHaveBeenCalled();
  });

  it("authenticates a valid token and exposes the auth context", async () => {
    const client = fakeClient(() => Promise.resolve(VALID));
    const res = await buildApp(client).request(
      "/protected",
      withBearer("tenant-token"),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tenant: "uniswap" });
    expect(client.validate).toHaveBeenCalledWith(
      hashBearerToken("tenant-token"),
    );
  });

  it("rejects unknown tokens with 401 (fail-closed)", async () => {
    const client = fakeClient(() => Promise.resolve({ valid: false }));
    const res = await buildApp(client).request(
      "/protected",
      withBearer("nope"),
    );
    expect(res.status).toBe(401);
  });

  it("caches positive verdicts with a 300s TTL and skips revalidation", async () => {
    const client = fakeClient(() => Promise.resolve(VALID));
    const redis = new FakeRedis();
    const app = buildApp(client, redis);

    await app.request("/protected", withBearer("tenant-token"));
    const res = await app.request("/protected", withBearer("tenant-token"));

    expect(res.status).toBe(200);
    expect(client.validate).toHaveBeenCalledTimes(1);
    const entry = redis.store.get(`token:${hashBearerToken("tenant-token")}`);
    expect(entry?.ttl).toBe(300);
  });

  it("caches negative verdicts with a shorter 60s TTL", async () => {
    const client = fakeClient(() => Promise.resolve({ valid: false }));
    const redis = new FakeRedis();
    const app = buildApp(client, redis);

    await app.request("/protected", withBearer("nope"));
    const res = await app.request("/protected", withBearer("nope"));

    expect(res.status).toBe(401);
    expect(client.validate).toHaveBeenCalledTimes(1);
    const entry = redis.store.get(`token:${hashBearerToken("nope")}`);
    expect(entry?.ttl).toBe(60);
  });

  it("serves cached tokens through a Authful outage", async () => {
    const redis = new FakeRedis();
    await redis.set(
      `token:${hashBearerToken("tenant-token")}`,
      JSON.stringify(VALID),
    );
    const client = fakeClient(() => Promise.reject(new Error("down")));

    const res = await buildApp(client, redis).request(
      "/protected",
      withBearer("tenant-token"),
    );
    expect(res.status).toBe(200);
    expect(client.validate).not.toHaveBeenCalled();
  });

  it("returns 503 when Authful is down and there is no cached verdict", async () => {
    const client = fakeClient(() => Promise.reject(new Error("down")));
    const res = await buildApp(client, new FakeRedis()).request(
      "/protected",
      withBearer("tenant-token"),
    );
    expect(res.status).toBe(503);
  });

  it("fails open on cache errors and falls back to Authful", async () => {
    const client = fakeClient(() => Promise.resolve(VALID));
    const brokenCache: TokenCacheStore = {
      get: () => Promise.reject(new Error("redis down")),
      set: () => Promise.reject(new Error("redis down")),
    };
    const res = await buildApp(client, brokenCache).request(
      "/protected",
      withBearer("tenant-token"),
    );
    expect(res.status).toBe(200);
    expect(client.validate).toHaveBeenCalledTimes(1);
  });
});
