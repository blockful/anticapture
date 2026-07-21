import { OpenAPIHono } from "@hono/zod-openapi";
import { afterEach, describe, expect, it, vi } from "vitest";

import { tenantRequestTotal } from "../metrics";
import type { TokenUsageBatch } from "./authful-client";
import type { AuthContext } from "./token-auth";
import { UsageAccumulator, normalizeRoute, usageMiddleware } from "./usage";
import type { TokenUsageWriter } from "./usage";

const DAO_APIS = new Map([["ens", "http://ens.internal"]]);

const AUTH: AuthContext = {
  tokenId: "11111111-1111-1111-1111-111111111111",
  tenant: "uniswap",
  name: "uniswap mcp",
  rateLimitPerMin: 600,
};

describe("normalizeRoute", () => {
  it.each([
    // DAO routes collapse every sub-resource to a single label so a
    // caller-controlled segment can't blow up cardinality.
    ["/ens/proposals/0x123", "/{dao}/*"],
    ["/ens/account-balances/0xabc", "/{dao}/*"],
    ["/ens/random-b3f8-uuid", "/{dao}/*"],
    ["/ens", "/{dao}/*"],
    ["/", "/"],
    // Any non-DAO first segment buckets to /unknown to bound cardinality.
    ["/daos", "/unknown"],
    ["/address/0xabc", "/unknown"],
    ["/totally-made-up", "/unknown"],
    ["/a|b|c", "/unknown"],
  ])("normalizes %s to %s", (path, expected) => {
    expect(normalizeRoute(path, DAO_APIS)).toBe(expected);
  });
});

describe("usageMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function buildApp(
    auth: AuthContext | null = AUTH,
    accumulator?: UsageAccumulator,
  ) {
    const app = new OpenAPIHono();
    if (auth) {
      app.use("*", async (c, next) => {
        c.set("auth", auth);
        await next();
      });
    }
    app.use("*", usageMiddleware(DAO_APIS, accumulator));
    app.get("/ens/proposals/:id", (c) => c.json({ ok: true }));
    return app;
  }

  it("increments the counter with tenant + normalized route", async () => {
    const add = vi.spyOn(tenantRequestTotal, "add");

    await buildApp().request("/ens/proposals/0x123");

    expect(add).toHaveBeenCalledWith(1, {
      tenant: AUTH.tenant,
      name: AUTH.name,
      route: "/{dao}/*",
    });
  });

  it("ignores requests without auth context", async () => {
    const add = vi.spyOn(tenantRequestTotal, "add");

    await buildApp(null).request("/ens/proposals/0x123");

    expect(add).not.toHaveBeenCalled();
  });

  it("counts requests even when the downstream handler throws", async () => {
    const add = vi.spyOn(tenantRequestTotal, "add");
    const app = new OpenAPIHono();
    app.use("*", async (c, next) => {
      c.set("auth", AUTH);
      await next();
    });
    app.use("*", usageMiddleware(DAO_APIS));
    app.get("/ens/proposals/:id", () => {
      throw new Error("downstream 5xx");
    });

    await Promise.resolve(app.request("/ens/proposals/0x123")).catch(
      () => undefined,
    );

    expect(add).toHaveBeenCalledWith(1, {
      tenant: AUTH.tenant,
      name: AUTH.name,
      route: "/{dao}/*",
    });
  });

  it("forwards user-key requests to persistent usage accumulation", async () => {
    const batches: TokenUsageBatch["items"][] = [];
    const accumulator = new UsageAccumulator(
      {
        recordUsage: async ({ items }) => {
          batches.push(items);
        },
      },
      { now: () => new Date("2026-07-20T12:00:00.000Z") },
    );
    const userAuth = { ...AUTH, tenant: "user:123" };

    await buildApp(userAuth, accumulator).request("/ens/proposals/0x123");
    await accumulator.flush();

    expect(batches).toEqual([
      [{ tokenId: userAuth.tokenId, day: "2026-07-20", count: 1 }],
    ]);
  });
});

describe("UsageAccumulator", () => {
  const USER_AUTH: AuthContext = {
    ...AUTH,
    tenant: "user:123",
  };
  const NOW = new Date("2026-07-20T23:59:00.000Z");

  it("accumulates user-key requests and flushes one daily increment", async () => {
    const batches: TokenUsageBatch["items"][] = [];
    const writer: TokenUsageWriter = {
      recordUsage: async ({ items }) => {
        batches.push(items);
      },
    };
    const accumulator = new UsageAccumulator(writer, { now: () => NOW });

    accumulator.record(USER_AUTH);
    accumulator.record(USER_AUTH);
    accumulator.record(AUTH);
    await accumulator.flush();

    expect(batches).toEqual([
      [{ tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 2 }],
    ]);
  });

  it("keeps UTC-day buckets separate across midnight", async () => {
    let now = NOW;
    const batches: TokenUsageBatch["items"][] = [];
    const writer: TokenUsageWriter = {
      recordUsage: async ({ items }) => {
        batches.push(items);
      },
    };
    const accumulator = new UsageAccumulator(writer, { now: () => now });

    accumulator.record(USER_AUTH);
    now = new Date("2026-07-21T00:01:00.000Z");
    accumulator.record(USER_AUTH);
    await accumulator.flush();

    expect(batches).toEqual([
      [
        { tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 1 },
        { tokenId: USER_AUTH.tokenId, day: "2026-07-21", count: 1 },
      ],
    ]);
  });

  it("retries the exact failed batch before flushing live counts", async () => {
    let attempt = 0;
    let releaseFailure: (() => void) | undefined;
    const failed = new Promise<void>((resolve) => {
      releaseFailure = resolve;
    });
    const batches: TokenUsageBatch[] = [];
    const writer: TokenUsageWriter = {
      recordUsage: async (batch) => {
        batches.push(batch);
        attempt += 1;
        if (attempt === 1) {
          await failed;
          throw new Error("Authful unavailable");
        }
      },
    };
    const ids = ["batch-1", "batch-2"];
    const accumulator = new UsageAccumulator(writer, {
      now: () => NOW,
      createIdempotencyKey: () => ids.shift()!,
    });

    accumulator.record(USER_AUTH);
    const firstFlush = accumulator.flush();
    accumulator.record(USER_AUTH);
    releaseFailure?.();
    await firstFlush;
    await accumulator.flush();
    await accumulator.flush();

    expect(batches).toEqual([
      {
        idempotencyKey: "batch-1",
        items: [{ tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 1 }],
      },
      {
        idempotencyKey: "batch-1",
        items: [{ tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 1 }],
      },
      {
        idempotencyKey: "batch-2",
        items: [{ tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 1 }],
      },
    ]);
  });

  it("keeps new buckets while another flush is in flight", async () => {
    let releaseFirst: (() => void) | undefined;
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const batches: TokenUsageBatch[] = [];
    const writer: TokenUsageWriter = {
      recordUsage: async (batch) => {
        batches.push(batch);
        if (batches.length === 1) await firstPending;
      },
    };
    const ids = ["batch-1", "batch-2"];
    const accumulator = new UsageAccumulator(writer, {
      maxBuckets: 1,
      now: () => NOW,
      createIdempotencyKey: () => ids.shift()!,
    });

    accumulator.record({ ...USER_AUTH, tokenId: "token-1" });
    const firstFlush = accumulator.flush();
    accumulator.record({ ...USER_AUTH, tokenId: "token-2" });
    accumulator.record({ ...USER_AUTH, tokenId: "token-3" });
    releaseFirst?.();
    await firstFlush;
    await accumulator.flush();

    expect(batches).toEqual([
      {
        idempotencyKey: "batch-1",
        items: [{ tokenId: "token-1", day: "2026-07-20", count: 1 }],
      },
      {
        idempotencyKey: "batch-2",
        items: [
          { tokenId: "token-2", day: "2026-07-20", count: 1 },
          { tokenId: "token-3", day: "2026-07-20", count: 1 },
        ],
      },
    ]);
  });

  it("discards a permanently rejected batch instead of retrying forever", async () => {
    const batches: TokenUsageBatch[] = [];
    const writer: TokenUsageWriter = {
      recordUsage: async (batch) => {
        batches.push(batch);
        throw new Error("invalid request");
      },
      isRetryableUsageError: () => false,
    };
    const accumulator = new UsageAccumulator(writer, {
      now: () => NOW,
      createIdempotencyKey: () => "batch-1",
    });

    accumulator.record(USER_AUTH);
    await accumulator.flush();
    await accumulator.flush();

    expect(batches).toEqual([
      {
        idempotencyKey: "batch-1",
        items: [{ tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 1 }],
      },
    ]);
  });

  it("flushes pending usage when stopped", async () => {
    const batches: TokenUsageBatch["items"][] = [];
    const writer: TokenUsageWriter = {
      recordUsage: async ({ items }) => {
        batches.push(items);
      },
    };
    const accumulator = new UsageAccumulator(writer, {
      flushIntervalMs: 60_000,
      now: () => NOW,
    });
    accumulator.start();
    accumulator.record(USER_AUTH);

    await accumulator.stop();

    expect(batches).toEqual([
      [{ tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 1 }],
    ]);
  });

  it("flushes requests that arrive during an in-flight shutdown batch", async () => {
    let releaseFirst: (() => void) | undefined;
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const batches: TokenUsageBatch["items"][] = [];
    const writer: TokenUsageWriter = {
      recordUsage: async ({ items }) => {
        if (batches.length === 0) await firstPending;
        batches.push(items);
      },
    };
    const accumulator = new UsageAccumulator(writer, { now: () => NOW });

    accumulator.record(USER_AUTH);
    const firstFlush = accumulator.flush();
    accumulator.record(USER_AUTH);
    const stopping = accumulator.stop();
    releaseFirst?.();
    await Promise.all([firstFlush, stopping]);

    expect(batches).toEqual([
      [{ tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 1 }],
      [{ tokenId: USER_AUTH.tokenId, day: "2026-07-20", count: 1 }],
    ]);
  });
});
