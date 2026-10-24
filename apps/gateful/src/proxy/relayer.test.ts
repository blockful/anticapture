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

    // A relayer sees far fewer than minimumRequests (10) per window, so the
    // consecutive-failure rule (default 5) is what opens it.
    for (let i = 0; i < 5; i++) {
      await app.request("/uni/relay/vote");
    }
    expect(fetchSpy).toHaveBeenCalledTimes(5);

    await app.request("/uni/relay/vote");
    expect(fetchSpy).toHaveBeenCalledTimes(5);
    expect(registry.get("relayer:uni").state).toBe("OPEN");
  });
});

describe("relayer status route", () => {
  const NOW = Date.parse("2026-10-24T12:00:00.000Z");
  const daoRelayers = new Map([["uni", "http://relayer-uni"]]);

  const UNREACHABLE = {
    available: false,
    reasons: ["RELAYER_UNREACHABLE"],
    checkedAt: "2026-10-24T12:00:00.000Z",
  };

  const RELAYER_STATUS = {
    available: true,
    reasons: [],
    checks: {
      paused: false,
      rpc: "ok",
      balance: "ok",
      rateLimiter: "ok",
      pendingTransactions: "ok",
      recentRelays: "ok",
    },
    balanceWei: "1000000000000000000",
    thresholdWei: "100000000000000000",
    checkedAt: "2026-10-24T11:59:55.000Z",
  };

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  const requestedUrls = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.map(([arg]) =>
      arg instanceof Request ? arg.url : String(arg),
    );

  let app: InstanceType<typeof OpenAPIHono>;
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    // Only Date: the breaker's cooldown reads it, and the probe's abort
    // timeout must keep running on real timers.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    app = new OpenAPIHono();
    registry = new CircuitBreakerRegistry();
    relayerProxy(app, daoRelayers, registry);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Opens relayer:uni the way real traffic does: five failed relays in a row. */
  async function openRelayerCircuit() {
    for (let i = 0; i < 5; i++) {
      await app.request("/uni/relay/vote", { method: "POST" });
    }
    expect(registry.get("relayer:uni").state).toBe("OPEN");
  }

  it("answers RELAYER_NOT_CONFIGURED, without fetching, for a DAO with no relayer", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const res = await app.request("/unknown/relay/status");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      available: false,
      reasons: ["RELAYER_NOT_CONFIGURED"],
      checkedAt: "2026-10-24T12:00:00.000Z",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes the relayer's answer through verbatim, without the caller's bearer", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockImplementation(async () => json(RELAYER_STATUS));

    const res = await app.request("/UNI/relay/status", {
      headers: { authorization: "Bearer tenant-token" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(RELAYER_STATUS);
    expect(requestedUrls(fetchSpy)).toEqual([
      "http://relayer-uni/relay/status",
    ]);
    const forwarded = fetchSpy.mock.calls[0]?.[0];
    expect(
      forwarded instanceof Request && forwarded.headers.has("authorization"),
    ).toBe(false);
  });

  it("passes an unavailable answer from the relayer through as well", async () => {
    const lowBalance = {
      ...RELAYER_STATUS,
      available: false,
      reasons: ["LOW_BALANCE"],
      checks: { ...RELAYER_STATUS.checks, balance: "low" },
      balanceWei: "1",
    };
    vi.spyOn(global, "fetch").mockImplementation(async () => json(lowBalance));

    const res = await app.request("/uni/relay/status");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(lowBalance);
  });

  it.each([
    [
      "a 500",
      () => json({ error: "Internal server error", code: "INTERNAL" }, 500),
    ],
    [
      "a structured 503",
      () =>
        json(
          { error: "Gasless relaying is paused", code: "RELAYER_PAUSED" },
          503,
        ),
    ],
    [
      "a non-JSON body",
      () =>
        new Response("<html>Bad Gateway</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    ],
    ["a body without a boolean available", () => json({ available: "yes" })],
    ["a JSON body that is not an object", () => json(true)],
  ])("answers RELAYER_UNREACHABLE on %s", async (_name, respond) => {
    vi.spyOn(global, "fetch").mockImplementation(async () => respond());

    const res = await app.request("/uni/relay/status");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(UNREACHABLE);
  });

  it.each([
    ["a network error", () => new TypeError("fetch failed")],
    [
      "a timeout",
      () =>
        new DOMException(
          "The operation was aborted due to timeout",
          "TimeoutError",
        ),
    ],
  ])("answers RELAYER_UNREACHABLE on %s", async (_name, makeError) => {
    vi.spyOn(global, "fetch").mockImplementation(async () => {
      throw makeError();
    });

    const res = await app.request("/uni/relay/status");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(UNREACHABLE);
  });

  it("answers RELAYER_UNREACHABLE, without probing, while the relayer circuit cools down", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockImplementation(async () => json({ error: "internal" }, 500));
    await openRelayerCircuit();

    const res = await app.request("/uni/relay/status");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(UNREACHABLE);
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });

  // A status probe must never decide whether real relay traffic is allowed:
  // dashboards poll it far more often than anyone relays.
  it("never moves the relayer circuit, however often the probe fails", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async () => {
      throw new TypeError("fetch failed");
    });

    for (let i = 0; i < 6; i++) {
      const res = await app.request("/uni/relay/status");
      expect(await res.json()).toEqual(UNREACHABLE);
    }

    expect(fetchSpy).toHaveBeenCalledTimes(6);
    expect(registry.get("relayer:uni").state).toBe("CLOSED");
  });

  it("probes a circuit past its cooldown without spending its half-open slot", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockImplementation(async () => json({ error: "internal" }, 500));
    await openRelayerCircuit();
    vi.setSystemTime(NOW + 30_000);
    fetchSpy.mockImplementation(async () => json(RELAYER_STATUS));

    const res = await app.request("/uni/relay/status");

    expect(await res.json()).toEqual(RELAYER_STATUS);
    expect(registry.get("relayer:uni").state).toBe("OPEN");
  });
});
