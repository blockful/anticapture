import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CircuitBreakerRegistry } from "./circuit-breaker-registry.js";

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
