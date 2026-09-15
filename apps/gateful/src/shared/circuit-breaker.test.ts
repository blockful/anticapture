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

    it("opens when a success completes a window that is over the threshold", async () => {
      const cb = createCircuitBreaker({
        minimumRequests: 10,
        failureRateThreshold: 0.5,
        // Keep the streak rule out of the way: this exercises the rate rule.
        consecutiveFailureThreshold: 10,
      });
      // Six failures settle first, below the minimum sample; the successes
      // that complete the window must still trigger the evaluation.
      await fail(cb, 6);
      await succeed(cb, 3);
      expect(cb.state).toBe("CLOSED");
      expect(await cb.execute(SUCCESS)).toBe("ok");
      expect(cb.state).toBe("OPEN");
    });

    it("forgets outcomes that fall outside the window", async () => {
      const cb = createCircuitBreaker({ windowMs: 10_000, minimumRequests: 4 });
      await fail(cb, 3);
      advanceTime(10_001);
      // Only this failure is inside the window: 1 request, below minimum.
      await fail(cb, 1);
      expect(cb.state).toBe("CLOSED");
    });

    it("opens after consecutive failures when the window holds too few requests", async () => {
      // A relayer or fan-out target sees a handful of calls per minute: the
      // rate rule never has enough samples, so straight failures must trip it.
      const cb = createCircuitBreaker({
        minimumRequests: 10,
        consecutiveFailureThreshold: 3,
      });
      await fail(cb, 2);
      expect(cb.state).toBe("CLOSED");
      await fail(cb, 1);
      expect(cb.state).toBe("OPEN");
    });

    it("keeps a streak across calls spaced wider than the window", async () => {
      // A relayer or a health probe may be called less than once per window.
      // The streak must survive those gaps, since it is the only rule that can
      // trip a key too quiet for the failure rate to mean anything.
      const cb = createCircuitBreaker({
        windowMs: 10_000,
        minimumRequests: 10,
        consecutiveFailureThreshold: 5,
      });
      for (let i = 0; i < 4; i++) {
        await fail(cb, 1);
        advanceTime(10_001);
        expect(cb.state).toBe("CLOSED");
      }

      await fail(cb, 1);
      expect(cb.state).toBe("OPEN");
    });

    it("resets the consecutive failure count on a success", async () => {
      const cb = createCircuitBreaker({
        minimumRequests: 10,
        consecutiveFailureThreshold: 3,
      });
      await fail(cb, 2);
      await succeed(cb, 1);
      await fail(cb, 2);
      expect(cb.state).toBe("CLOSED");
    });

    it("uses the failure rate, not the streak, once the window is busy", async () => {
      const cb = createCircuitBreaker({
        minimumRequests: 4,
        failureRateThreshold: 0.5,
        consecutiveFailureThreshold: 3,
      });
      // 20 successes then 3 straight failures: 13% failure rate on a busy key.
      await succeed(cb, 20);
      await fail(cb, 3);
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

    it("publishes nothing for a lazy breaker that never leaves CLOSED", async () => {
      const cb = createCircuitBreaker({ lazyStateMetric: true });
      await succeed(cb, 5);
      expect(cb.state).toBe("CLOSED");
      expect(circuitBreakerState.record).not.toHaveBeenCalled();
    });

    it("publishes every transition once a lazy breaker has tripped", async () => {
      const cb = createCircuitBreaker({
        lazyStateMetric: true,
        minimumRequests: 1,
      });
      await fail(cb, 1);
      expect(circuitBreakerState.record).toHaveBeenLastCalledWith(2, {
        name: "test",
      });

      // Recovery is published too, so the series never sticks at OPEN.
      advanceTime(1000);
      await cb.execute(SUCCESS);
      expect(cb.state).toBe("CLOSED");
      expect(circuitBreakerState.record).toHaveBeenLastCalledWith(0, {
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

  describe("stragglers from an earlier generation", () => {
    /** Starts `count` calls that hang until their rejecter is invoked. */
    function pendingCalls(cb: CircuitBreaker, count: number) {
      const rejecters: Array<() => void> = [];
      const settled = Array.from({ length: count }, () =>
        cb
          .execute(
            () =>
              new Promise<string>((_, reject) => {
                rejecters.push(() => reject(new Error("downstream error")));
              }),
          )
          .catch(() => "failed"),
      );
      return { rejecters, settled };
    }

    const trippingBreaker = () =>
      createCircuitBreaker({
        minimumRequests: 100,
        consecutiveFailureThreshold: 5,
      });

    it("does not let the rest of the batch stretch the cooldown", async () => {
      const cb = trippingBreaker();
      const { rejecters, settled } = pendingCalls(cb, 10);

      for (const reject of rejecters.slice(0, 5)) reject();
      await Promise.all(settled.slice(0, 5));
      expect(cb.state).toBe("OPEN");
      expect(cb.nextRetryIn).toBe(1000);

      // The slower half of the same batch fails while the circuit is already
      // open: the cooldown must still end where the opening batch put it.
      advanceTime(500);
      for (const reject of rejecters.slice(5)) reject();
      await Promise.all(settled.slice(5));

      expect(cb.state).toBe("OPEN");
      expect(cb.nextRetryIn).toBe(500);
    });

    it("does not let the rest of the batch reopen a recovered circuit", async () => {
      const cb = trippingBreaker();
      const { rejecters, settled } = pendingCalls(cb, 10);

      for (const reject of rejecters.slice(0, 5)) reject();
      await Promise.all(settled.slice(0, 5));
      expect(cb.state).toBe("OPEN");

      advanceTime(1000);
      await cb.execute(SUCCESS);
      expect(cb.state).toBe("CLOSED");

      for (const reject of rejecters.slice(5)) reject();
      await Promise.all(settled.slice(5));

      expect(cb.state).toBe("CLOSED");
    });
  });

  describe("isIdle", () => {
    it("is idle while nothing has failed", async () => {
      const cb = createCircuitBreaker();
      expect(cb.isIdle()).toBe(true);
      await succeed(cb, 3);
      expect(cb.isIdle()).toBe(true);
    });

    it("is not idle while a failure is still counted", async () => {
      const cb = createCircuitBreaker();
      await succeed(cb, 3);
      await fail(cb, 1);
      expect(cb.state).toBe("CLOSED");
      expect(cb.isIdle()).toBe(false);

      // A success ends the streak, but the failure still sits in the window.
      await succeed(cb, 1);
      expect(cb.isIdle()).toBe(false);

      // Idle again once that failure has aged out of the window.
      advanceTime(10_000);
      expect(cb.isIdle()).toBe(true);
    });

    it("is not idle while a call is still running", async () => {
      const cb = createCircuitBreaker();
      let release!: () => void;
      const call = cb.execute(
        () =>
          new Promise<string>((resolve) => {
            release = () => resolve("ok");
          }),
      );
      expect(cb.state).toBe("CLOSED");
      expect(cb.isIdle()).toBe(false);

      release();
      await call;
      expect(cb.isIdle()).toBe(true);
    });

    it("is not idle while the circuit is open", async () => {
      const cb = createCircuitBreaker({ minimumRequests: 1 });
      await fail(cb, 1);
      expect(cb.state).toBe("OPEN");
      expect(cb.isIdle()).toBe(false);
    });
  });

  describe("isStale", () => {
    it("goes stale once a failing key has been quiet for a window", async () => {
      const cb = createCircuitBreaker({
        windowMs: 10_000,
        minimumRequests: 10,
      });
      await fail(cb, 1);
      expect(cb.state).toBe("CLOSED");
      expect(cb.isIdle()).toBe(false);
      expect(cb.isStale()).toBe(false);

      // The failure stops mattering once no call has arrived for a window.
      advanceTime(10_000);
      expect(cb.isStale()).toBe(true);
    });

    it("keeps an open circuit until its cooldown has elapsed", async () => {
      const cb = createCircuitBreaker({
        windowMs: 10_000,
        minimumRequests: 1,
        cooldownMs: 20_000,
        maxCooldownMs: 20_000,
      });
      await fail(cb, 1);
      expect(cb.state).toBe("OPEN");

      // Quiet for a window but still inside the cooldown: it is shielding the
      // route and must keep its place.
      advanceTime(10_000);
      expect(cb.isStale()).toBe(false);

      // Past the cooldown it would probe on the next call anyway.
      advanceTime(10_001);
      expect(cb.isStale()).toBe(true);
    });

    it("is never stale while a call is running", async () => {
      const cb = createCircuitBreaker({ windowMs: 10_000 });
      let release!: () => void;
      const call = cb.execute(
        () =>
          new Promise<string>((resolve) => {
            release = () => resolve("ok");
          }),
      );
      advanceTime(60_000);
      expect(cb.isStale()).toBe(false);

      release();
      await call;
      expect(cb.isStale()).toBe(false);
    });
  });
});
