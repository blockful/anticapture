import {
  CircuitBreaker,
  type CircuitBreakerOptions,
} from "./circuit-breaker.js";

const STATE_SEVERITY = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 } as const;

/** What a DAO API route name looks like (`proposals`, `voting-powers`).
 *  Ids, hashes and addresses (`123`, `0xabc…`) never match, so a path such
 *  as `/0xdead…/x` cannot mint a breaker of its own. */
const ROUTE_SEGMENT = /^[a-z][a-z0-9-]{0,63}$/;

/** Distinct route breakers a DAO may have. Paths are client-controlled, so
 *  without a cap a scan of made-up segments could grow the registry (and the
 *  `circuit_breaker_state` metric series) without bound. Past the cap, new
 *  segments share the DAO-level breaker. */
export const MAX_ROUTES_PER_DAO = 64;

/** An OPEN circuit whose cooldown has elapsed will probe on its next call, so
 *  for reporting it ranks as HALF_OPEN rather than as an outage. */
const severity = (breaker: CircuitBreaker): number =>
  breaker.state === "OPEN" && breaker.nextRetryIn === 0
    ? STATE_SEVERITY.HALF_OPEN
    : STATE_SEVERITY[breaker.state];

export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();
  private readonly routesPerDao = new Map<string, number>();

  constructor(private readonly opts?: CircuitBreakerOptions) {}

  /** Returns the CircuitBreaker for a key, creating it lazily if needed. */
  get(key: string): CircuitBreaker {
    let breaker = this.breakers.get(key);
    if (!breaker) {
      breaker = new CircuitBreaker(key, this.opts);
      this.breakers.set(key, breaker);
    }
    return breaker;
  }

  /** Builds the key for a DAO API request from its upstream path: the DAO
   *  plus the first path segment when that segment reads as a route name
   *  (`ens:proposals`), the bare DAO otherwise. Nothing here knows the API's
   *  route list: a route added upstream gets its own breaker the first time
   *  it is called. */
  static proxyKey(dao: string, path: string): string {
    const [, segment] = path.split("/");
    return segment && ROUTE_SEGMENT.test(segment) ? `${dao}:${segment}` : dao;
  }

  /** Breaker guarding a request to a DAO API (proxy, fan-out, health probe),
   *  keyed per DAO and route so one failing route cannot take the DAO's other
   *  routes offline, and so every caller of the same route shares one view of
   *  its health. Bounded by `MAX_ROUTES_PER_DAO`. */
  forProxy(dao: string, path: string): CircuitBreaker {
    const key = CircuitBreakerRegistry.proxyKey(dao, path);
    if (key === dao || this.breakers.has(key)) return this.get(key);

    const routes = this.routesPerDao.get(dao) ?? 0;
    if (routes >= MAX_ROUTES_PER_DAO) return this.get(dao);
    this.routesPerDao.set(dao, routes + 1);
    return this.get(key);
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
