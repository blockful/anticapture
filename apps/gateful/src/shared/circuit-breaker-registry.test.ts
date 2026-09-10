import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CircuitBreakerRegistry,
  MAX_ROUTES_PER_DAO,
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

  it("caps the number of route breakers per DAO", () => {
    const registry = new CircuitBreakerRegistry();
    for (let i = 0; i < MAX_ROUTES_PER_DAO; i++) {
      expect(registry.forProxy("ens", `/route-${i}`).name).toBe(
        `ens:route-${i}`,
      );
    }
    // Past the cap a new segment shares the DAO breaker; known routes keep
    // theirs, and the cap is per DAO.
    expect(registry.forProxy("ens", "/one-too-many").name).toBe("ens");
    expect(registry.forProxy("ens", "/route-0").name).toBe("ens:route-0");
    expect(registry.forProxy("uni", "/one-too-many").name).toBe(
      "uni:one-too-many",
    );
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
