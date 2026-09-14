import {
  CircuitBreaker,
  type CircuitBreakerOptions,
} from "./circuit-breaker.js";

const STATE_SEVERITY = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 } as const;

/** What a DAO API route name looks like (`proposals`, `voting-powers`).
 *  Ids, hashes and addresses (`123`, `0xabc…`) never match, so a path such
 *  as `/0xdead…/x` cannot mint a breaker of its own. */
const ROUTE_SEGMENT = /^[a-z][a-z0-9-]{0,63}$/;

/** Route breakers a DAO may hold at once. Paths are client-controlled, so
 *  without a cap a scan of made-up segments could grow the registry (and the
 *  `circuit_breaker_state` metric series) without bound. The cap is on live
 *  breakers, not on the names ever seen: reaching it evicts an idle route
 *  rather than freezing the set, so made-up paths cannot squat the slots. */
export const MAX_ROUTES_PER_DAO = 64;

/** An OPEN circuit whose cooldown has elapsed will probe on its next call, so
 *  for reporting it ranks as HALF_OPEN rather than as an outage. */
const severity = (breaker: CircuitBreaker): number =>
  breaker.state === "OPEN" && breaker.nextRetryIn === 0
    ? STATE_SEVERITY.HALF_OPEN
    : STATE_SEVERITY[breaker.state];

export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();
  /** Route keys currently holding a slot, per DAO, ordered least recently used
   *  first. A Set iterates in insertion order, so re-inserting a key on every
   *  use keeps the busiest routes at the end and the stale ones at the front. */
  private readonly routeKeysPerDao = new Map<string, Set<string>>();

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
   *  its health. At most `MAX_ROUTES_PER_DAO` routes hold a breaker at a time;
   *  a route arriving at a full DAO takes the slot of the least recently used
   *  idle route, and only shares the DAO breaker when no slot can be freed. */
  forProxy(dao: string, path: string): CircuitBreaker {
    const key = CircuitBreakerRegistry.proxyKey(dao, path);
    if (key === dao) return this.get(dao);

    const routes = this.routesFor(dao);
    if (routes.has(key)) {
      // Re-insert so the key counts as most recently used.
      routes.delete(key);
      routes.add(key);
      return this.get(key);
    }

    if (routes.size >= MAX_ROUTES_PER_DAO && !this.evictIdleRoute(routes)) {
      return this.get(dao);
    }
    routes.add(key);
    return this.get(key);
  }

  private routesFor(dao: string): Set<string> {
    let routes = this.routeKeysPerDao.get(dao);
    if (!routes) {
      routes = new Set<string>();
      this.routeKeysPerDao.set(dao, routes);
    }
    return routes;
  }

  /** Frees one slot by dropping the least recently used CLOSED route breaker.
   *
   *  Only CLOSED breakers are evicted. An OPEN or HALF_OPEN circuit is actively
   *  shielding a failing route, and dropping it would let a burst of made-up
   *  paths reopen the very route it was protecting; a tripped route therefore
   *  keeps its slot until it recovers. Evicting a CLOSED breaker only discards
   *  a sliding window of successes, which the route rebuilds on its next calls.
   *  When every slot is held by a tripped circuit there is nothing safe to
   *  evict and the caller falls back to the DAO breaker. */
  private evictIdleRoute(routes: Set<string>): boolean {
    for (const key of routes) {
      if (this.breakers.get(key)?.state !== "CLOSED") continue;
      routes.delete(key);
      this.breakers.delete(key);
      return true;
    }
    return false;
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
