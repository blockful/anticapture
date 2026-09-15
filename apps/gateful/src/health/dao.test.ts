import { OpenAPIHono } from "@hono/zod-openapi";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry";
import { daoHealth } from "./dao";
import { health } from "./route";

const UPSTREAM = "http://api.example";

/** A DAO API whose deep health check is broken while it answers everything
 *  else, including the shallow /health the gateway probes. */
const brokenHealthFull = () =>
  vi.fn().mockImplementation((input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : input.toString();
    return Promise.resolve(
      url.endsWith("/health/full")
        ? new Response("boom", { status: 500 })
        : new Response(JSON.stringify({ status: "ok" })),
    );
  });

const gatewayWithDaoHealth = () => {
  const registry = new CircuitBreakerRegistry({
    minimumRequests: 2,
    cooldownMs: 60_000,
  });
  const daoApis = new Map([["ens", UPSTREAM]]);
  const app = new OpenAPIHono();
  daoHealth(app, daoApis, registry);
  health(app, registry, { daoApis, daoRelayers: new Map() });
  return { app, registry };
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("per-DAO health route", () => {
  it("keeps its probe failures out of gateway readiness", async () => {
    vi.stubGlobal("fetch", brokenHealthFull());
    const { app, registry } = gatewayWithDaoHealth();

    // Poll the DAO health route until its own breaker has tripped.
    for (let i = 0; i < 5; i++) {
      await app.request("/ens/health");
    }
    expect(registry.get("health:ens").state).toBe("OPEN");

    // Readiness reflects real traffic, which never failed.
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(registry.summary("ens").state).toBe("CLOSED");
  });

  it("reports the circuit real traffic sees, not the probe's", async () => {
    vi.stubGlobal("fetch", brokenHealthFull());
    const { app, registry } = gatewayWithDaoHealth();

    const body = (await (await app.request("/ens/health")).json()) as {
      circuit?: { state: string };
    };
    expect(body.circuit?.state).toBe("CLOSED");

    // A failing route of real traffic is what changes the reported circuit.
    const proposals = registry.forProxy("ens", "/proposals");
    for (let i = 0; i < 2; i++) {
      await expect(
        proposals.execute(async () => {
          throw new Error("upstream down");
        }),
      ).rejects.toThrow();
    }
    expect(registry.summary("ens").state).toBe("OPEN");
  });
});
