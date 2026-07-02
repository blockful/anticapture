import { OpenAPIHono } from "@hono/zod-openapi";
import { afterEach, describe, expect, it, vi } from "vitest";

import { tenantRequestTotal } from "../metrics";
import type { AuthContext } from "./token-auth";
import { normalizeRoute, usageMiddleware } from "./usage";

const DAO_APIS = new Map([["ens", "http://ens.internal"]]);

const AUTH: AuthContext = {
  tokenId: "11111111-1111-1111-1111-111111111111",
  tenant: "uniswap",
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

  function buildApp(auth: AuthContext | null = AUTH) {
    const app = new OpenAPIHono();
    if (auth) {
      app.use("*", async (c, next) => {
        c.set("auth", auth);
        await next();
      });
    }
    app.use("*", usageMiddleware(DAO_APIS));
    app.get("/ens/proposals/:id", (c) => c.json({ ok: true }));
    return app;
  }

  it("increments the counter with tenant + normalized route", async () => {
    const add = vi.spyOn(tenantRequestTotal, "add");

    await buildApp().request("/ens/proposals/0x123");

    expect(add).toHaveBeenCalledWith(1, {
      tenant: AUTH.tenant,
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
      route: "/{dao}/*",
    });
  });
});
