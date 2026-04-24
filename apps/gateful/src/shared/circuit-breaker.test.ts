import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CircuitBreaker } from "./circuit-breaker.js";

const SUCCESS = async () => "ok";
const FAIL = async () => {
  throw new Error("downstream error");
};

function createCircuitBreaker(opts?: {
  failureThreshold?: number;
  cooldownMs?: number;
  maxCooldownMs?: number;
}) {
  return new CircuitBreaker("test", {
    failureThreshold: 3,
    cooldownMs: 1000,
    maxCooldownMs: 8000,
    ...opts,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

function advanceTime(ms: number) {
  vi.setSystemTime(Date.now() + ms);
}

describe("CircuitBreaker", () => {
  describe("CLOSED state", () => {
    it("passes through successful calls", async () => {
      const cb = createCircuitBreaker();
      await cb.execute(SUCCESS);
      await cb.execute(SUCCESS);
      const result = await cb.execute(SUCCESS);
      expect(result).toBe("ok");
      expect(cb.state).toBe("CLOSED");
    });

    it("re-throws errors without opening when below threshold", async () => {
      const cb = createCircuitBreaker({ failureThreshold: 3 });
      await expect(cb.execute(FAIL)).rejects.toThrow("downstream error");
      await expect(cb.execute(FAIL)).rejects.toThrow("downstream error");
      expect(cb.state).toBe("CLOSED");
    });

    it("opens after reaching failure threshold", async () => {
      const cb = createCircuitBreaker({ failureThreshold: 3 });
      await expect(cb.execute(FAIL)).rejects.toThrow();
      await expect(cb.execute(FAIL)).rejects.toThrow();
      await expect(cb.execute(FAIL)).rejects.toThrow();
      expect(cb.state).toBe("OPEN");
    });

    it("resets failure counter after a success", async () => {
      const cb = createCircuitBreaker({ failureThreshold: 3 });
      await expect(cb.execute(FAIL)).rejects.toThrow();
      await expect(cb.execute(FAIL)).rejects.toThrow();
      await cb.execute(SUCCESS); // reset
      await expect(cb.execute(FAIL)).rejects.toThrow();
      await expect(cb.execute(FAIL)).rejects.toThrow();
      expect(cb.state).toBe("CLOSED"); // still needs one more failure
    });
  });

  describe("HALF_OPEN state", () => {
    async function halfOpenBreaker() {
      const cb = createCircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 1000,
      });
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(FAIL)).rejects.toThrow();
      }
      advanceTime(1000);
      return cb;
    }

    it("closes circuit on probe success", async () => {
      const cb = await halfOpenBreaker();
      await cb.execute(SUCCESS);
      expect(cb.state).toBe("CLOSED");
    });

    it("reopens circuit on probe failure", async () => {
      const cb = await halfOpenBreaker();
      await expect(cb.execute(FAIL)).rejects.toThrow("downstream error");
      expect(cb.state).toBe("OPEN");
    });
  });
});
