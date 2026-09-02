import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { circuitBreakerState } from "../metrics.js";
import {
  CircuitBreaker,
  type CircuitBreakerOptions,
} from "./circuit-breaker.js";

const SUCCESS = async () => "ok";
const FAIL = async () => {
  throw new Error("downstream error");
};

function createCircuitBreaker(opts?: CircuitBreakerOptions) {
  return new CircuitBreaker("test", {
    windowMs: 10_000,
    minimumRequests: 4,
    failureRateThreshold: 0.5,
    cooldownMs: 1000,
    maxCooldownMs: 8000,
    ...opts,
  });
}

async function fail(cb: CircuitBreaker, times = 1) {
  for (let i = 0; i < times; i++) {
    await expect(cb.execute(FAIL)).rejects.toThrow();
  }
}

async function succeed(cb: CircuitBreaker, times = 1) {
  for (let i = 0; i < times; i++) {
    await cb.execute(SUCCESS);
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(0);
  vi.spyOn(circuitBreakerState, "record");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function advanceTime(ms: number) {
  vi.setSystemTime(Date.now() + ms);
}

describe("CircuitBreaker", () => {
  describe("CLOSED state", () => {
    it("passes through successful calls", async () => {
      const cb = createCircuitBreaker();
      await succeed(cb, 2);
      const result = await cb.execute(SUCCESS);
      expect(result).toBe("ok");
      expect(cb.state).toBe("CLOSED");
    });

    it("re-throws errors without opening while the window holds too few requests", async () => {
      const cb = createCircuitBreaker({ minimumRequests: 4 });
      await expect(cb.execute(FAIL)).rejects.toThrow("downstream error");
      await fail(cb, 2);
      expect(cb.state).toBe("CLOSED");
    });

    it("opens once the windowed failure rate crosses the threshold", async () => {
      const cb = createCircuitBreaker({
        minimumRequests: 4,
        failureRateThreshold: 0.5,
      });
      await succeed(cb, 2);
      await fail(cb, 2);
      expect(cb.state).toBe("OPEN");
      expect(circuitBreakerState.record).toHaveBeenLastCalledWith(2, {
        name: "test",
      });
    });

    it("stays closed when a burst only partially fails", async () => {
      const cb = createCircuitBreaker({
        minimumRequests: 4,
        failureRateThreshold: 0.5,
      });
      // A reload fanning out 12 calls where 5 fail: 42% < 50%.
      await succeed(cb, 7);
      await fail(cb, 5);
      expect(cb.state).toBe("CLOSED");
    });

    it("forgets outcomes that fall outside the window", async () => {
      const cb = createCircuitBreaker({ windowMs: 10_000, minimumRequests: 4 });
      await fail(cb, 3);
      advanceTime(10_001);
      // Only this failure is inside the window: 1 request, below minimum.
      await fail(cb, 1);
      expect(cb.state).toBe("CLOSED");
    });

    it("rejects calls instantly while OPEN", async () => {
      const cb = createCircuitBreaker({ minimumRequests: 2 });
      await fail(cb, 2);
      const fn = vi.fn(SUCCESS);
      await expect(cb.execute(fn)).rejects.toThrow(
        'Circuit breaker "test" is OPEN',
      );
      expect(fn).not.toHaveBeenCalled();
      expect(cb.nextRetryIn).toBe(1000);
    });
  });

  describe("HALF_OPEN state", () => {
    async function halfOpenBreaker() {
      const cb = createCircuitBreaker({ minimumRequests: 2, cooldownMs: 1000 });
      await fail(cb, 2);
      advanceTime(1000);
      return cb;
    }

    it("closes circuit on probe success", async () => {
      const cb = await halfOpenBreaker();
      await cb.execute(SUCCESS);
      expect(cb.state).toBe("CLOSED");
      expect(circuitBreakerState.record).toHaveBeenLastCalledWith(0, {
        name: "test",
      });
    });

    it("reopens circuit with a longer cooldown on probe failure", async () => {
      const cb = await halfOpenBreaker();
      await expect(cb.execute(FAIL)).rejects.toThrow("downstream error");
      expect(cb.state).toBe("OPEN");
      expect(cb.nextRetryIn).toBe(2000);
      expect(circuitBreakerState.record).toHaveBeenCalledWith(1, {
        name: "test",
      });
      expect(circuitBreakerState.record).toHaveBeenLastCalledWith(2, {
        name: "test",
      });
    });

    it("lets a single probe through while others are rejected", async () => {
      const cb = await halfOpenBreaker();
      let release!: () => void;
      const probe = cb.execute(
        () =>
          new Promise<string>((resolve) => {
            release = () => resolve("ok");
          }),
      );
      await expect(cb.execute(SUCCESS)).rejects.toThrow("is OPEN");
      release();
      expect(await probe).toBe("ok");
      expect(cb.state).toBe("CLOSED");
    });
  });
});
