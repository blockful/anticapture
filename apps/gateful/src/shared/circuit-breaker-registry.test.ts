import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { circuitBreakerState } from "../metrics.js";
import {
  CircuitBreakerRegistry,
  MAX_ROUTES_PER_DAO,
} from "./circuit-breaker-registry.js";

const FAIL = async () => {
  throw new Error("downstream error");
};

/** Route breakers currently held by a DAO (the DAO-level key is not one). */
const routeKeys = (registry: CircuitBreakerRegistry, dao: string): string[] =>
  [...registry.getAll().keys()].filter((key) => key.startsWith(`${dao}:`));

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CircuitBreakerRegistry", () => {
  it("keys proxy breakers by DAO and first route segment", () => {
    expect(CircuitBreakerRegistry.proxyKey("ens", "/proposals")).toBe(
      "ens:proposals",
    );
    expect(CircuitBreakerRegistry.proxyKey("ens", "/proposals/123/votes")).toBe(
      "ens:proposals",
    );
    expect(CircuitBreakerRegistry.proxyKey("ens", "/")).toBe("ens");
    expect(CircuitBreakerRegistry.proxyKey("ens", "")).toBe("ens");
  });

  it("gives any route-shaped segment its own key without a route list", () => {
    // A route added to the API tomorrow is isolated the first time it is hit.
    expect(CircuitBreakerRegistry.proxyKey("ens", "/total-supply")).toBe(
      "ens:total-supply",
    );
    expect(CircuitBreakerRegistry.proxyKey("ens", "/does-not-exist")).toBe(
      "ens:does-not-exist",
    );
  });

  it("keeps ids, hashes and addresses on the DAO breaker", () => {
    expect(CircuitBreakerRegistry.proxyKey("ens", "/0xdeadbeef/x")).toBe("ens");
    expect(CircuitBreakerRegistry.proxyKey("ens", "/123")).toBe("ens");
    expect(CircuitBreakerRegistry.proxyKey("ens", "/Proposals")).toBe("ens");
  });

  it("caps how many route breakers a DAO holds at once", () => {
    const registry = new CircuitBreakerRegistry();
    for (let i = 0; i < MAX_ROUTES_PER_DAO * 4; i++) {
      registry.forProxy("ens", `/route-${i}`);
    }
    expect(routeKeys(registry, "ens")).toHaveLength(MAX_ROUTES_PER_DAO);
    // The cap is per DAO.
    expect(registry.forProxy("uni", "/proposals").name).toBe("uni:proposals");
  });

  it("evicts the least recently used idle route to make room", () => {
    const registry = new CircuitBreakerRegistry();
    for (let i = 0; i < MAX_ROUTES_PER_DAO; i++) {
      expect(registry.forProxy("ens", `/route-${i}`).name).toBe(
        `ens:route-${i}`,
      );
    }
    // Using route-0 again makes route-1 the least recently used key.
    const routeZero = registry.forProxy("ens", "/route-0");

    expect(registry.forProxy("ens", "/one-too-many").name).toBe(
      "ens:one-too-many",
    );
    expect(registry.getAll().has("ens:route-1")).toBe(false);
    expect(registry.getAll().has("ens:route-0")).toBe(true);
    // The recently used route keeps the breaker it already had.
    expect(registry.forProxy("ens", "/route-0")).toBe(routeZero);
  });

  it("lets a real route get its own breaker after a flood of fake ones", () => {
    const registry = new CircuitBreakerRegistry();
    for (let i = 0; i < MAX_ROUTES_PER_DAO * 10; i++) {
      registry.forProxy("ens", `/probe-${i}/x`);
    }

    expect(registry.forProxy("ens", "/proposals").name).toBe("ens:proposals");
    expect(routeKeys(registry, "ens")).toHaveLength(MAX_ROUTES_PER_DAO);
  });

  it("keeps a tripped route out of the eviction pool", async () => {
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });
    const proposals = registry.forProxy("ens", "/proposals");
    await expect(proposals.execute(FAIL)).rejects.toThrow();
    expect(proposals.state).toBe("OPEN");

    for (let i = 0; i < MAX_ROUTES_PER_DAO * 3; i++) {
      registry.forProxy("ens", `/probe-${i}`);
    }

    expect(registry.forProxy("ens", "/proposals")).toBe(proposals);
    expect(proposals.state).toBe("OPEN");
  });

  it("does not let a route seen after the cap block the other routes", async () => {
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });
    for (let i = 0; i < MAX_ROUTES_PER_DAO; i++) {
      registry.forProxy("ens", `/probe-${i}`);
    }

    const late = registry.forProxy("ens", "/late-route");
    expect(late.name).toBe("ens:late-route");
    await expect(late.execute(FAIL)).rejects.toThrow();

    // The failure stayed on the late route: the DAO breaker and every other
    // route are still closed.
    expect(registry.get("ens").state).toBe("CLOSED");
    expect(registry.forProxy("ens", "/votes").state).toBe("CLOSED");
    expect(registry.forProxy("ens", "/votes").name).toBe("ens:votes");
  });

  it("keeps routes that never trip out of the state gauge", async () => {
    const record = vi.spyOn(circuitBreakerState, "record");
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });

    for (let i = 0; i < MAX_ROUTES_PER_DAO * 2; i++) {
      registry.forProxy("ens", `/probe-${i}`);
    }
    // Made-up paths cost a slot at most, never a metric series: the OTel SDK
    // keeps every attribute set for the life of the process.
    expect(record).not.toHaveBeenCalled();

    // A DAO key comes from configuration, so it reports from the start.
    expect(registry.get("ens").state).toBe("CLOSED");
    expect(record).toHaveBeenCalledWith(0, { name: "ens" });

    // A route that actually trips does publish its state.
    const proposals = registry.forProxy("ens", "/proposals");
    await expect(proposals.execute(FAIL)).rejects.toThrow();
    expect(record).toHaveBeenLastCalledWith(2, { name: "ens:proposals" });
  });

  it("shares the DAO breaker only when every slot is a tripped route", async () => {
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });
    for (let i = 0; i < MAX_ROUTES_PER_DAO; i++) {
      const breaker = registry.forProxy("ens", `/route-${i}`);
      await expect(breaker.execute(FAIL)).rejects.toThrow();
      expect(breaker.state).toBe("OPEN");
    }

    expect(registry.forProxy("ens", "/one-too-many").name).toBe("ens");
  });

  it("returns the same breaker for the same key", () => {
    const registry = new CircuitBreakerRegistry();
    expect(registry.get("ens:votes")).toBe(registry.get("ens:votes"));
    expect(registry.get("ens:votes")).not.toBe(registry.get("ens:proposals"));
  });

  it("does not report an OPEN breaker past its cooldown as the worst state", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(0);
    const registry = new CircuitBreakerRegistry({
      minimumRequests: 1,
      cooldownMs: 1_000,
    });
    await expect(registry.get("ens:revenue").execute(FAIL)).rejects.toThrow();
    expect(registry.summary("ens").name).toBe("ens:revenue");

    // Cooldown elapsed: still OPEN until probed, but no longer an outage.
    vi.setSystemTime(1_000);
    expect(registry.get("ens:revenue").state).toBe("OPEN");
    expect(registry.summary("ens").nextRetryIn).toBe(0);

    // A circuit still inside its cooldown outranks the expired one.
    await expect(registry.get("ens:votes").execute(FAIL)).rejects.toThrow();
    expect(registry.summary("ens").name).toBe("ens:votes");
    vi.useRealTimers();
  });

  it("summarises a DAO by its worst scoped breaker", async () => {
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });
    registry.get("ens");
    registry.get("ens:votes");
    // Not scoped to ens: must not leak into its summary.
    await expect(registry.get("relayer:ens").execute(FAIL)).rejects.toThrow();

    expect(registry.summary("ens").state).toBe("CLOSED");

    await expect(registry.get("ens:proposals").execute(FAIL)).rejects.toThrow();

    const worst = registry.summary("ens");
    expect(worst.name).toBe("ens:proposals");
    expect(worst.state).toBe("OPEN");
  });
});
