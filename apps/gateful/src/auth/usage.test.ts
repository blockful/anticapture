import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it, vi } from "vitest";

import type { AuthContext } from "./token-auth";
import type { TokenfulClient } from "./tokenful-client";
import { UsageTracker, normalizeRoute, usageMiddleware } from "./usage";

const DAO_APIS = new Map([["ens", "http://ens.internal"]]);

const AUTH: AuthContext = {
  tokenId: "11111111-1111-1111-1111-111111111111",
  tenant: "uniswap",
  rateLimitPerMin: 600,
};

function fakeClient(impl: () => Promise<void> = () => Promise.resolve()) {
  return { recordUsageBatch: vi.fn(impl) } as unknown as TokenfulClient & {
    recordUsageBatch: ReturnType<typeof vi.fn>;
  };
}

describe("normalizeRoute", () => {
  it.each([
    ["/ens/proposals/0x123", "/{dao}/proposals"],
    ["/ens/account-balances/0xabc", "/{dao}/account-balances"],
    ["/ens", "/{dao}"],
    ["/daos", "/daos"],
    ["/address/0xabc", "/address"],
    ["/", "/"],
  ])("normalizes %s to %s", (path, expected) => {
    expect(normalizeRoute(path, DAO_APIS)).toBe(expected);
  });
});

describe("UsageTracker", () => {
  it("accumulates counts per (token, route, hour) and flushes them", async () => {
    const client = fakeClient();
    const tracker = new UsageTracker(client);

    tracker.record(AUTH.tokenId, "/{dao}/proposals");
    tracker.record(AUTH.tokenId, "/{dao}/proposals");
    tracker.record(AUTH.tokenId, "/daos");
    await tracker.flush();

    expect(client.recordUsageBatch).toHaveBeenCalledTimes(1);
    const entries = client.recordUsageBatch.mock.calls[0]![0];
    expect(entries).toHaveLength(2);
    expect(entries).toContainEqual(
      expect.objectContaining({
        tokenId: AUTH.tokenId,
        route: "/{dao}/proposals",
        count: 2,
      }),
    );
    // Hours are truncated ISO timestamps.
    expect(entries[0].hour).toMatch(/T\d{2}:00:00\.000Z$/);
  });

  it("does not call Tokenful when there is nothing to flush", async () => {
    const client = fakeClient();
    await new UsageTracker(client).flush();
    expect(client.recordUsageBatch).not.toHaveBeenCalled();
  });

  it("re-buffers counts when the flush fails", async () => {
    const client = fakeClient(() => Promise.reject(new Error("down")));
    const tracker = new UsageTracker(client);

    tracker.record(AUTH.tokenId, "/daos");
    await tracker.flush();
    expect(client.recordUsageBatch).toHaveBeenCalledTimes(1);

    // Counts survived the failure and flush again, merged.
    tracker.record(AUTH.tokenId, "/daos");
    client.recordUsageBatch.mockImplementation(() => Promise.resolve());
    await tracker.flush();

    const entries = client.recordUsageBatch.mock.calls[1]![0];
    expect(entries).toContainEqual(expect.objectContaining({ count: 2 }));
  });
});

describe("usageMiddleware", () => {
  function buildApp(tracker: UsageTracker, auth: AuthContext | null = AUTH) {
    const app = new OpenAPIHono();
    if (auth) {
      app.use("*", async (c, next) => {
        c.set("auth", auth);
        await next();
      });
    }
    app.use("*", usageMiddleware(tracker, DAO_APIS));
    app.get("/ens/proposals/:id", (c) => c.json({ ok: true }));
    return app;
  }

  it("records authenticated requests with a normalized route", async () => {
    const client = fakeClient();
    const tracker = new UsageTracker(client);
    const record = vi.spyOn(tracker, "record");

    await buildApp(tracker).request("/ens/proposals/0x123");

    expect(record).toHaveBeenCalledWith(AUTH.tokenId, "/{dao}/proposals");
  });

  it("ignores requests without auth context", async () => {
    const tracker = new UsageTracker(fakeClient());
    const record = vi.spyOn(tracker, "record");

    await buildApp(tracker, null).request("/ens/proposals/0x123");

    expect(record).not.toHaveBeenCalled();
  });
});
