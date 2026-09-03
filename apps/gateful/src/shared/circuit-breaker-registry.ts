import {
  CircuitBreaker,
  type CircuitBreakerOptions,
} from "./circuit-breaker.js";

const STATE_SEVERITY = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 } as const;

/** First path segments served by the DAO APIs. Route keys derive from
 *  client-controlled paths, so only these known groups get their own breaker;
 *  anything else shares the DAO-level breaker. This bounds the registry (and
 *  the circuit_breaker_state series) to DAOs x groups without ever collapsing
 *  a real route into another one. */
export const ROUTE_GROUPS: ReadonlySet<string> = new Set([
  "accounts",
  "active-supply",
  "addresses",
  "average-turnout",
  "balances",
  "dao",
  "delegation-percentage",
  "event-relevance",
  "feed",
  "health",
  "last-update",
  "offchain",
  "proposals",
  "proposals-activity",
  "revenue",
  "token",
  "token-metrics",
  "treasury",
  "votes",
  "voting-powers",
]);

/** An OPEN circuit whose cooldown has elapsed will probe on its next call, so
 *  for reporting it ranks as HALF_OPEN rather than as an outage. */
const severity = (breaker: CircuitBreaker): number =>
  breaker.state === "OPEN" && breaker.nextRetryIn === 0
    ? STATE_SEVERITY.HALF_OPEN
    : STATE_SEVERITY[breaker.state];

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

  /** Builds the proxy key for a DAO request from its upstream path: per route
   *  group when the first segment is a known API route, the DAO otherwise. */
  static proxyKey(dao: string, path: string): string {
    const [, segment] = path.split("/");
    return segment && ROUTE_GROUPS.has(segment) ? `${dao}:${segment}` : dao;
  }

  /** Breaker guarding a proxied DAO request. */
  forProxy(dao: string, path: string): CircuitBreaker {
    return this.get(CircuitBreakerRegistry.proxyKey(dao, path));
  }

  /** The worst-state breaker among `<key>` and `<key>:*` (for health reporting).
   *  Falls back to `<key>` itself when no scoped breaker exists. */
  summary(key: string): CircuitBreaker {
    let worst = this.get(key);
    for (const [name, breaker] of this.breakers) {
      if (name.startsWith(`${key}:`) && severity(breaker) > severity(worst)) {
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
