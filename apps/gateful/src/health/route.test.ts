import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry";
import { health } from "./route";

const HealthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  commit: z.string().optional(),
  upstreams: z.record(
    z.string(),
    z.object({
      kind: z.enum([
        "dao-api",
        "relayer",
        "address-enrichment",
        "token-service",
        "unknown",
      ]),
      status: z.enum(["ok", "down"]),
      circuit: z.enum(["CLOSED", "OPEN", "HALF_OPEN"]),
      nextRetryIn: z.number().int().optional(),
      error: z.string().optional(),
      commit: z.string().optional(),
    }),
  ),
});

async function readHealthResponse(res: Response) {
  return HealthResponseSchema.parse(await res.json());
}

function appWithHealth(
  opts: Parameters<typeof health>[2],
  registry = new CircuitBreakerRegistry({
    minimumRequests: 2,
    cooldownMs: 60_000,
  }),
) {
  const app = new OpenAPIHono();
  health(app, registry, opts);
  return { app, registry };
}

const okFetch = () =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" })));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("gateway health route", () => {
  it("returns ok when all configured upstreams are healthy", async () => {
    const fetch = okFetch();
    vi.stubGlobal("fetch", fetch);

    const { app } = appWithHealth({
      daoApis: new Map([["ens", "http://api.example"]]),
      daoRelayers: new Map([["ens", "http://relayer.example"]]),
      addressEnrichmentUrl: "http://address-enrichment.example",
      commitSha: "abc123",
    });

    const res = await app.request("/health");
    const body = await readHealthResponse(res);

    expect(res.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      commit: "abc123",
      upstreams: {
        ens: { kind: "dao-api", status: "ok", circuit: "CLOSED" },
        "relayer:ens": { kind: "relayer", status: "ok", circuit: "CLOSED" },
        "address-enrichment": {
          kind: "address-enrichment",
          status: "ok",
          circuit: "CLOSED",
        },
      },
    });
    expect(fetch).toHaveBeenCalledWith("http://api.example/health", {
      signal: expect.any(AbortSignal),
    });
    expect(fetch).toHaveBeenCalledWith("http://relayer.example/health", {
      signal: expect.any(AbortSignal),
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://address-enrichment.example/health",
      {
        signal: expect.any(AbortSignal),
      },
    );
  });

  // The deploy gate reads this: gateful serves DAO API schemas in /docs/json,
  // so "which release answered" has to travel with "did it answer".
  it("surfaces the commit a DAO API reports, and copes without one", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((url: string) =>
          Promise.resolve(
            url.includes("api.example")
              ? new Response(
                  JSON.stringify({ database: "ok", commit: "sha-1" }),
                )
              : new Response("pong"),
          ),
        ),
    );

    const { app } = appWithHealth({
      daoApis: new Map([["ens", "http://api.example"]]),
      daoRelayers: new Map([["ens", "http://relayer.example"]]),
    });

    const body = await readHealthResponse(await app.request("/health"));

    // `kind` is what lets the deploy gate demand a commit from DAO APIs while
    // exempting everything else.
    expect(body.upstreams.ens).toEqual({
      kind: "dao-api",
      status: "ok",
      circuit: "CLOSED",
      commit: "sha-1",
    });
    expect(body.upstreams["relayer:ens"]).toEqual({
      kind: "relayer",
      status: "ok",
      circuit: "CLOSED",
    });
  });

  it("returns degraded when a DAO API returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("fail", { status: 500 })),
    );

    const { app } = appWithHealth({
      daoApis: new Map([["ens", "http://api.example"]]),
      daoRelayers: new Map(),
    });

    const res = await app.request("/health");
    const body = await readHealthResponse(res);

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.upstreams.ens).toMatchObject({
      status: "down",
      circuit: "CLOSED",
      error: "ens /health returned 500",
    });
  });

  it("returns degraded when a DAO API fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const { app } = appWithHealth({
      daoApis: new Map([["ens", "http://api.example"]]),
      daoRelayers: new Map(),
    });

    const res = await app.request("/health");
    const body = await readHealthResponse(res);

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.upstreams.ens).toMatchObject({
      status: "down",
      circuit: "CLOSED",
      error: "offline",
    });
  });

  it("returns degraded when a relayer is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("fail", { status: 503 })),
    );

    const { app } = appWithHealth({
      daoApis: new Map(),
      daoRelayers: new Map([["ens", "http://relayer.example"]]),
    });

    const res = await app.request("/health");
    const body = await readHealthResponse(res);

    expect(res.status).toBe(503);
    expect(body.upstreams["relayer:ens"]).toMatchObject({
      status: "down",
      circuit: "CLOSED",
      error: "relayer:ens /health returned 503",
    });
  });

  it("returns degraded when address enrichment is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("fail", { status: 502 })),
    );

    const { app } = appWithHealth({
      daoApis: new Map(),
      daoRelayers: new Map(),
      addressEnrichmentUrl: "http://address-enrichment.example",
    });

    const res = await app.request("/health");
    const body = await readHealthResponse(res);

    expect(res.status).toBe(503);
    expect(body.upstreams["address-enrichment"]).toMatchObject({
      status: "down",
      circuit: "CLOSED",
      error: "address-enrichment /health returned 502",
    });
  });

  it("reports an open circuit without making another fetch", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetch);

    const { app, registry } = appWithHealth({
      daoApis: new Map([["ens", "http://api.example"]]),
      daoRelayers: new Map(),
    });

    await expect(registry.get("ens").execute(fetch)).rejects.toThrow("offline");
    await expect(registry.get("ens").execute(fetch)).rejects.toThrow("offline");
    fetch.mockClear();

    const res = await app.request("/health");
    const body = await readHealthResponse(res);

    expect(res.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
    expect(body.upstreams.ens).toMatchObject({
      status: "down",
      circuit: "OPEN",
      error: "circuit open",
    });
    expect(body.upstreams.ens.nextRetryIn).toBeGreaterThan(0);
  });

  it("does not trip the proxy circuit when probes fail repeatedly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const { app, registry } = appWithHealth({
      daoApis: new Map([["ens", "http://api.example"]]),
      daoRelayers: new Map(),
    });

    // minimumRequests is 2 — poll more than that.
    for (let i = 0; i < 5; i++) {
      const res = await app.request("/health");
      const body = await readHealthResponse(res);
      expect(body.upstreams.ens).toMatchObject({
        status: "down",
        circuit: "CLOSED",
      });
    }

    // The proxy breaker must stay CLOSED for real traffic.
    expect(registry.get("ens").state).toBe("CLOSED");
  });

  it("probes the configured token service and reports it degraded when down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("fail", { status: 500 })),
    );

    const { app } = appWithHealth({
      daoApis: new Map(),
      daoRelayers: new Map(),
      tokenServiceUrl: "http://authful.example",
    });

    const res = await app.request("/health");
    const body = await readHealthResponse(res);

    expect(res.status).toBe(503);
    expect(body.upstreams.authful).toMatchObject({
      status: "down",
      circuit: "CLOSED",
      error: "authful /health returned 500",
    });
  });

  it("returns ok when no upstreams are configured", async () => {
    const fetch = okFetch();
    vi.stubGlobal("fetch", fetch);

    const { app } = appWithHealth({
      daoApis: new Map(),
      daoRelayers: new Map(),
      commitSha: "abc123",
    });

    const res = await app.request("/health");
    const body = await readHealthResponse(res);

    expect(res.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      commit: "abc123",
      upstreams: {},
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
