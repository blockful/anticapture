import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CircuitBreakerRegistry,
  MAX_BREAKERS,
} from "./circuit-breaker-registry.js";

const FAIL = async () => {
  throw new Error("downstream error");
};

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

  it("returns the same breaker for the same key", () => {
    const registry = new CircuitBreakerRegistry();
    expect(registry.get("ens:votes")).toBe(registry.get("ens:votes"));
    expect(registry.get("ens:votes")).not.toBe(registry.get("ens:proposals"));
  });

  it("falls back to the DAO breaker once the registry is full", () => {
    const registry = new CircuitBreakerRegistry();
    for (let i = 0; i < MAX_BREAKERS; i++) registry.get(`ens:route-${i}`);

    expect(registry.forProxy("ens", "/route-1").name).toBe("ens:route-1");
    expect(registry.forProxy("ens", "/unknown").name).toBe("ens");
    expect(registry.getAll().size).toBe(MAX_BREAKERS + 1);
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
