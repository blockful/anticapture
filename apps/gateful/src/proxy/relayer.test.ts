import { OpenAPIHono } from "@hono/zod-openapi";
import { vi } from "vitest";

import { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry";

import { relayerProxy } from "./relayer";

describe("relayer proxy route", () => {
  const daoRelayers = new Map([
    ["uni", "http://relayer-uni"],
    ["ens", "http://relayer-ens"],
  ]);

  let app: InstanceType<typeof OpenAPIHono>;
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    app = new OpenAPIHono();
    registry = new CircuitBreakerRegistry();
    relayerProxy(app, daoRelayers, registry);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 404 for unconfigured DAO relayer", async () => {
    const res = await app.request("/unknown/relay/vote");
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(404);
    expect(body.error).toContain('Relayer for DAO "unknown" not configured');
  });

  it("should proxy relay requests to the DAO relayer", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ hash: "0xabc" }), { status: 200 }),
      );

    const res = await app.request("/uni/relay/vote", {
      method: "POST",
      body: "{}",
    });
    const body = (await res.json()) as { hash: string };

    expect(res.status).toBe(200);
    expect(body.hash).toBe("0xabc");
    const arg = fetchSpy.mock.calls[0]?.[0];
    const calledUrl = arg instanceof Request ? arg.url : String(arg);
    expect(calledUrl).toBe("http://relayer-uni/relay/vote");
  });

  it("should forward config and rate-limit requests with query strings", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const configRes = await app.request("/ENS/config?chain=1");
    const rateLimitRes = await app.request(
      "/ens/rate-limit/0x123?operation=vote",
    );

    expect(configRes.status).toBe(200);
    expect(rateLimitRes.status).toBe(200);
    const calledUrls = fetchSpy.mock.calls.map((call) => {
      const arg = call[0];
      return arg instanceof Request ? arg.url : String(arg);
    });
    expect(calledUrls).toEqual([
      "http://relayer-ens/config?chain=1",
      "http://relayer-ens/rate-limit/0x123?operation=vote",
    ]);
  });

  it("passes a structured relayer error through and does not count it as a failure", async () => {
    // The relayer answered 503 RELAYER_LOW_BALANCE on purpose: nothing was
    // broadcast and the relayer is up. The client needs that code to offer
    // the wallet fallback, and the breaker must not treat it as an outage.
    const relayerBody = {
      code: "RELAYER_LOW_BALANCE",
      message: "Relayer wallet balance is too low to submit transactions",
    };
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify(relayerBody), {
          status: 503,
          headers: { "content-type": "application/json" },
        }),
    );

    for (let i = 0; i < 6; i++) {
      const res = await app.request("/uni/relay/queue", {
        method: "POST",
        body: JSON.stringify({ proposalId: "1" }),
      });
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual(relayerBody);
    }
    expect(fetchSpy).toHaveBeenCalledTimes(6);
    expect(registry.get("relayer:uni").state).toBe("CLOSED");
  });

  it("counts the relayer's own crash response (500 INTERNAL) as an upstream failure", async () => {
    // The relayer's global error handler wraps unhandled exceptions with the
    // error contract; a nonempty code alone must not exempt it.
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            error: "Internal server error",
            code: "INTERNAL",
          }),
          { status: 500, headers: { "content-type": "application/json" } },
        ),
    );

    for (let i = 0; i < 5; i++) {
      const res = await app.request("/uni/relay/queue", { method: "POST" });
      expect(res.status).toBe(500);
    }
    expect(fetchSpy).toHaveBeenCalledTimes(5);
    expect(registry.get("relayer:uni").state).toBe("OPEN");
  });

  it("still treats a 5xx without a relayer error code as an upstream failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Bad Gateway", {
        status: 502,
        headers: { "content-type": "text/plain" },
      }),
    );

    const res = await app.request("/uni/relay/queue", { method: "POST" });
    expect(res.status).toBe(500);
  });

  it("should open the relayer circuit and short-circuit after repeated upstream failures", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "internal" }), { status: 500 }),
      );

    for (let i = 0; i < 5; i++) {
      await app.request("/uni/relay/vote");
    }
    expect(fetchSpy).toHaveBeenCalledTimes(5);

    await app.request("/uni/relay/vote");
    expect(fetchSpy).toHaveBeenCalledTimes(5);
    expect(registry.get("relayer:uni").state).toBe("OPEN");
  });
});
