import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { circuitBreakerState } from "../metrics.js";
import {
  CircuitBreakerRegistry,
  MAX_METRIC_ROUTES_PER_DAO,
  MAX_ROUTES_PER_DAO,
} from "./circuit-breaker-registry.js";

const SUCCESS = async () => "ok";
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

  it("reads a route name through its case and its encoding", () => {
    // One route, one breaker, however the client spells the segment.
    expect(CircuitBreakerRegistry.proxyKey("ens", "/Proposals")).toBe(
      "ens:proposals",
    );
    expect(CircuitBreakerRegistry.proxyKey("ens", "/%50roposals")).toBe(
      "ens:proposals",
    );
  });

  it("puts every non-route shape on one key per DAO", () => {
    // Ids, hashes and malformed encoding are chosen by the client, so they
    // share a key instead of eroding the breaker that guards every route.
    expect(CircuitBreakerRegistry.proxyKey("ens", "/0xdeadbeef/x")).toBe(
      "ens:other",
    );
    expect(CircuitBreakerRegistry.proxyKey("ens", "/123")).toBe("ens:other");
    expect(CircuitBreakerRegistry.proxyKey("ens", "/%zz")).toBe("ens:other");
    expect(CircuitBreakerRegistry.proxyKey("ens", "/")).toBe("ens:other");
    expect(CircuitBreakerRegistry.proxyKey("ens", "")).toBe("ens:other");
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

  it("reclaims the slots of routes that went quiet after an outage", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(0);
    const registry = new CircuitBreakerRegistry({
      windowMs: 30_000,
      cooldownMs: 1_000,
      minimumRequests: 10,
      consecutiveFailureThreshold: 5,
    });

    // During an upstream outage, one failing call to each of 64 made-up
    // segments takes every slot the DAO has.
    for (let i = 0; i < MAX_ROUTES_PER_DAO; i++) {
      await expect(
        registry.forProxy("ens", `/probe-${i}`).execute(FAIL),
      ).rejects.toThrow();
    }
    expect(routeKeys(registry, "ens")).toHaveLength(MAX_ROUTES_PER_DAO);

    // The upstream recovers and those paths are never requested again.
    vi.setSystemTime(60_000);
    const proposals = registry.forProxy("ens", "/proposals");
    const votes = registry.forProxy("ens", "/votes");
    expect(proposals.name).toBe("ens:proposals");
    expect(votes.name).toBe("ens:votes");

    // Neither fell back to the shared DAO breaker, so one route failing does
    // not reject the other.
    for (let i = 0; i < 5; i++) {
      await expect(proposals.execute(FAIL)).rejects.toThrow();
    }
    expect(proposals.state).toBe("OPEN");
    await expect(votes.execute(SUCCESS)).resolves.toBe("ok");
    vi.useRealTimers();
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

    // The failure stayed on the late route: the DAO breaker was never even
    // created, and another route still reaches upstream.
    expect(registry.getAll().has("ens")).toBe(false);
    await expect(
      registry.forProxy("ens", "/votes").execute(SUCCESS),
    ).resolves.toBe("ok");
  });

  it("keeps a route that is counting failures out of the eviction pool", async () => {
    const registry = new CircuitBreakerRegistry({
      minimumRequests: 100,
      consecutiveFailureThreshold: 5,
    });
    const proposals = registry.forProxy("ens", "/proposals");
    for (let i = 0; i < 3; i++) {
      await expect(proposals.execute(FAIL)).rejects.toThrow();
    }
    expect(proposals.state).toBe("CLOSED");

    // Made-up paths interleaved with the failing route must not wipe its
    // history: they fill the remaining slots and evict only each other.
    for (let i = 0; i < MAX_ROUTES_PER_DAO * 3; i++) {
      registry.forProxy("ens", `/probe-${i}`);
    }
    expect(routeKeys(registry, "ens")).toHaveLength(MAX_ROUTES_PER_DAO);
    expect(registry.forProxy("ens", "/proposals")).toBe(proposals);

    // The streak survived, so the fifth failure still trips the route.
    for (let i = 0; i < 2; i++) {
      await expect(proposals.execute(FAIL)).rejects.toThrow();
    }
    expect(proposals.state).toBe("OPEN");
  });

  it("keeps a route with a request in flight out of the eviction pool", async () => {
    const registry = new CircuitBreakerRegistry({
      minimumRequests: 100,
      consecutiveFailureThreshold: 5,
    });
    const proposals = registry.forProxy("ens", "/proposals");
    let timeOut!: () => void;
    const slowCall = proposals
      .execute(
        () =>
          new Promise<string>((_, reject) => {
            timeOut = () => reject(new Error("upstream timeout"));
          }),
      )
      .catch(() => "failed");

    // The slow route is the least recently used key, so a flood would take its
    // slot if an unsettled call counted as idle.
    for (let i = 0; i < MAX_ROUTES_PER_DAO * 3; i++) {
      registry.forProxy("ens", `/probe-${i}`);
    }
    expect(registry.forProxy("ens", "/proposals")).toBe(proposals);

    timeOut();
    await slowCall;

    // The timeout landed on the breaker callers still get, so it counts
    // towards the trip instead of being lost on a detached instance.
    for (let i = 0; i < 4; i++) {
      await expect(proposals.execute(FAIL)).rejects.toThrow();
    }
    expect(registry.forProxy("ens", "/proposals").state).toBe("OPEN");
  });

  it("evicts a route again once its request has settled", async () => {
    const registry = new CircuitBreakerRegistry();
    const proposals = registry.forProxy("ens", "/proposals");
    let release!: () => void;
    const slowCall = proposals.execute(
      () =>
        new Promise<string>((resolve) => {
          release = () => resolve("ok");
        }),
    );
    for (let i = 0; i < MAX_ROUTES_PER_DAO - 1; i++) {
      registry.forProxy("ens", `/probe-${i}`);
    }

    release();
    await slowCall;
    expect(proposals.isIdle()).toBe(true);

    // Nothing is pending and nothing failed, so the slot can be reused.
    expect(registry.forProxy("ens", "/one-more").name).toBe("ens:one-more");
    expect(registry.getAll().has("ens:proposals")).toBe(false);
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

  it("closes the series of an evicted route that had reported OPEN", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(0);
    const record = vi.spyOn(circuitBreakerState, "record");
    const registry = new CircuitBreakerRegistry({
      windowMs: 30_000,
      cooldownMs: 1_000,
      minimumRequests: 1,
    });

    await expect(
      registry.forProxy("ens", "/proposals").execute(FAIL),
    ).rejects.toThrow();
    expect(record).toHaveBeenLastCalledWith(2, { name: "ens:proposals" });

    // Quiet past the cooldown, so the route is reclaimed under slot pressure.
    vi.setSystemTime(60_000);
    for (let i = 0; i < MAX_ROUTES_PER_DAO; i++) {
      registry.forProxy("ens", `/probe-${i}`);
    }
    expect(registry.getAll().has("ens:proposals")).toBe(false);

    // Without this the gauge would report that route as open for good: the
    // replacement breaker is lazy and says nothing while it is healthy.
    expect(record).toHaveBeenLastCalledWith(0, { name: "ens:proposals" });
    vi.useRealTimers();
  });

  it("records nothing when evicting a route that never reported", () => {
    const record = vi.spyOn(circuitBreakerState, "record");
    const registry = new CircuitBreakerRegistry();

    for (let i = 0; i < MAX_ROUTES_PER_DAO + 1; i++) {
      registry.forProxy("ens", `/probe-${i}`);
    }

    expect(registry.getAll().has("ens:probe-0")).toBe(false);
    expect(record).not.toHaveBeenCalled();
  });

  it("folds route names past the metric budget into one bucket", async () => {
    const record = vi.spyOn(circuitBreakerState, "record");
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });

    for (let i = 0; i < MAX_METRIC_ROUTES_PER_DAO; i++) {
      const breaker = registry.forProxy("ens", `/route-${i}`);
      await expect(breaker.execute(FAIL)).rejects.toThrow();
    }
    const last = MAX_METRIC_ROUTES_PER_DAO - 1;
    expect(record).toHaveBeenLastCalledWith(2, { name: `ens:route-${last}` });

    // Past the budget the state is still reported, under a shared name that
    // cannot grow the metric's attribute set.
    const late = registry.forProxy("ens", "/late-route");
    await expect(late.execute(FAIL)).rejects.toThrow();
    expect(record).toHaveBeenLastCalledWith(2, { name: "ens:other-routes" });

    // The budget is per DAO.
    const uni = registry.forProxy("uni", "/late-route");
    await expect(uni.execute(FAIL)).rejects.toThrow();
    expect(record).toHaveBeenLastCalledWith(2, { name: "uni:late-route" });
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

  it("gives fan-out its own key so its tighter deadline stays contained", async () => {
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });
    const fanOut = registry.forFanOut("ens", "/dao");
    await expect(fanOut.execute(FAIL)).rejects.toThrow();
    expect(fanOut.state).toBe("OPEN");

    // The proxy route of the same path is untouched, and so is the summary.
    await expect(
      registry.forProxy("ens", "/dao").execute(SUCCESS),
    ).resolves.toBe("ok");
    expect(registry.summary("ens").state).toBe("CLOSED");
  });

  it("does not report an OPEN breaker past its cooldown as the worst state", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(0);
    const registry = new CircuitBreakerRegistry({
      minimumRequests: 1,
      cooldownMs: 1_000,
    });
    await expect(
      registry.forProxy("ens", "/revenue").execute(FAIL),
    ).rejects.toThrow();
    expect(registry.summary("ens").name).toBe("ens:revenue");

    // Cooldown elapsed: still OPEN until probed, but no longer an outage.
    vi.setSystemTime(1_000);
    expect(registry.forProxy("ens", "/revenue").state).toBe("OPEN");
    expect(registry.summary("ens").nextRetryIn).toBe(0);

    // A circuit still inside its cooldown outranks the expired one.
    await expect(
      registry.forProxy("ens", "/votes").execute(FAIL),
    ).rejects.toThrow();
    expect(registry.summary("ens").name).toBe("ens:votes");
    vi.useRealTimers();
  });

  it("summarises a DAO by its worst route breaker", async () => {
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });
    registry.forProxy("ens", "/votes");
    expect(registry.summary("ens").state).toBe("CLOSED");

    await expect(
      registry.forProxy("ens", "/proposals").execute(FAIL),
    ).rejects.toThrow();

    const worst = registry.summary("ens");
    expect(worst.name).toBe("ens:proposals");
    expect(worst.state).toBe("OPEN");
  });

  it("never reads another namespace as one of a DAO's routes", async () => {
    const registry = new CircuitBreakerRegistry({ minimumRequests: 1 });
    // Nothing stops a DAO from being called "relayer", so a summary must not
    // go by name prefix.
    await expect(registry.get("relayer:ens").execute(FAIL)).rejects.toThrow();
    await expect(
      registry.get("health:relayer").execute(FAIL),
    ).rejects.toThrow();
    await expect(
      registry.forFanOut("relayer", "/dao").execute(FAIL),
    ).rejects.toThrow();

    expect(registry.summary("relayer").state).toBe("CLOSED");

    await expect(
      registry.forProxy("relayer", "/proposals").execute(FAIL),
    ).rejects.toThrow();
    expect(registry.summary("relayer").name).toBe("relayer:proposals");
  });
});
