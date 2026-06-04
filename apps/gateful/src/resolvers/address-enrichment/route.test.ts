import { OpenAPIHono } from "@hono/zod-openapi";
import { vi } from "vitest";

import { CircuitBreakerRegistry } from "../../shared/circuit-breaker-registry";

import { addressEnrichment } from "./route";

describe("address-enrichment route", () => {
  let app: InstanceType<typeof OpenAPIHono>;
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    app = new OpenAPIHono();
    registry = new CircuitBreakerRegistry();
    addressEnrichment(app, "http://enrichment-api", registry);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 404 when service is not configured", async () => {
    const unconfiguredApp = new OpenAPIHono();
    addressEnrichment(unconfiguredApp, undefined, new CircuitBreakerRegistry());

    const res = await unconfiguredApp.request("/address-enrichment/0x123");
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(404);
    expect(body.error).toContain("not configured");
  });

  it("should proxy to upstream and return its response", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ens: "vitalik.eth" }), { status: 200 }),
      );

    const res = await app.request("/address-enrichment/address/0x123");
    const body = (await res.json()) as { ens: string };

    expect(res.status).toBe(200);
    expect(body.ens).toBe("vitalik.eth");
    const arg = fetchSpy.mock.calls[0]?.[0];
    const calledUrl = arg instanceof Request ? arg.url : String(arg);
    expect(calledUrl).toBe("http://enrichment-api/address/0x123");
  });

  it("should forward query strings to upstream", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const res = await app.request(
      "/address-enrichment/address/0x123?include=ens&chain=1",
    );

    expect(res.status).toBe(200);
    const arg = fetchSpy.mock.calls[0]?.[0];
    const calledUrl = arg instanceof Request ? arg.url : String(arg);
    expect(calledUrl).toBe(
      "http://enrichment-api/address/0x123?include=ens&chain=1",
    );
  });

  it("should propagate upstream error status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "internal" }), { status: 500 }),
    );

    const res = await app.request("/address-enrichment/0x123");

    expect(res.status).toBe(500);
  });

  it("should open the circuit and short-circuit after repeated upstream failures", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "internal" }), { status: 500 }),
      );

    // Default failureThreshold is 5 — drive the breaker OPEN.
    for (let i = 0; i < 5; i++) {
      await app.request("/address-enrichment/0x123");
    }
    expect(fetchSpy).toHaveBeenCalledTimes(5);

    // Circuit is now OPEN: the next request is rejected without hitting upstream.
    await app.request("/address-enrichment/0x123");
    expect(fetchSpy).toHaveBeenCalledTimes(5);
    expect(registry.get("address-enrichment").state).toBe("OPEN");
  });
});
