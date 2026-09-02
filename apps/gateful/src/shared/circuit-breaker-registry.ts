import {
  CircuitBreaker,
  type CircuitBreakerOptions,
} from "./circuit-breaker.js";

const STATE_SEVERITY = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 } as const;

export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();

  constructor(private readonly opts?: CircuitBreakerOptions) {}

  /** Returns the CircuitBreaker for a key, creating it lazily if needed.
   *  Proxy traffic is keyed per DAO and route group (`<dao>:<route>`) so one
   *  failing route cannot take a DAO's other routes offline. */
  get(key: string): CircuitBreaker {
    let breaker = this.breakers.get(key);
    if (!breaker) {
      breaker = new CircuitBreaker(key, this.opts);
      this.breakers.set(key, breaker);
    }
    return breaker;
  }

  /** Builds the proxy key for a DAO request from its upstream path. */
  static proxyKey(dao: string, path: string): string {
    const [, segment] = path.split("/");
    return segment ? `${dao}:${segment}` : dao;
  }

  /** The worst-state breaker among `<key>` and `<key>:*` (for health reporting).
   *  Falls back to `<key>` itself when no scoped breaker exists. */
  summary(key: string): CircuitBreaker {
    let worst = this.get(key);
    for (const [name, breaker] of this.breakers) {
      if (
        name.startsWith(`${key}:`) &&
        STATE_SEVERITY[breaker.state] > STATE_SEVERITY[worst.state]
      ) {
        worst = breaker;
      }
    }
    return worst;
  }

  /** Returns all registered circuit breakers (for health endpoint). */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }
}
