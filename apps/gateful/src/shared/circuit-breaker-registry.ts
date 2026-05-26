import { CircuitBreaker } from "./circuit-breaker.js";

type CircuitBreakerOptions = {
  failureThreshold?: number;
  cooldownMs?: number;
  maxCooldownMs?: number;
};

export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();

  constructor(private readonly opts?: CircuitBreakerOptions) {}

  /** Returns the CircuitBreaker for a DAO, creating it lazily if needed. */
  get(daoName: string): CircuitBreaker {
    let breaker = this.breakers.get(daoName);
    if (!breaker) {
      breaker = new CircuitBreaker(daoName, this.opts);
      this.breakers.set(daoName, breaker);
    }
    return breaker;
  }

  /** Returns all registered circuit breakers (for health endpoint). */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }
}
