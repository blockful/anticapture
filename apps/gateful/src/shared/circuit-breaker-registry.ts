import {
  CircuitBreaker,
  type CircuitBreakerOptions,
} from "./circuit-breaker.js";

const STATE_SEVERITY = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 } as const;

/** What a DAO API route name looks like (`proposals`, `voting-powers`). */
const ROUTE_SEGMENT = /^[a-z][a-z0-9-]{0,63}$/;

/** Route segment used for everything that does not read as a route name: ids,
 *  hashes, addresses, an empty path. Those shapes are picked by the client, so
 *  they share one key per DAO instead of eroding the DAO breaker that guards
 *  every route, and they cannot mint a breaker each. A real route called
 *  `other` simply shares that key, which costs it nothing. */
const OTHER_ROUTE = "other";

/** Route breakers a DAO may hold at once. Paths are client-controlled, so
 *  without a cap a scan of made-up segments could grow the registry without
 *  bound. The cap is on live breakers, not on the names ever seen: reaching it
 *  evicts an idle or stale route rather than freezing the set, so made-up paths
 *  cannot squat the slots. */
export const MAX_ROUTES_PER_DAO = 64;

/** Route names a DAO may report under in `circuit_breaker_state`. Eviction lets
 *  the slots host far more names over a process lifetime than they hold at
 *  once, and the OTel SDK keeps every attribute set for as long as it runs, so
 *  names are budgeted separately from slots. Past this many, route breakers
 *  report under `<dao>:other-routes`. The gauge is synchronous, so that series
 *  carries the last transition among the routes sharing it, not a combined
 *  view of their health: read it as "a route past the budget changed state".
 *  The named series go to the routes seen first, which are the ones real
 *  traffic uses. */
export const MAX_METRIC_ROUTES_PER_DAO = 32;

/** Shared metric name for route breakers past the per-DAO name budget. */
const OTHER_ROUTES_METRIC = "other-routes";

/** An OPEN circuit whose cooldown has elapsed will probe on its next call, so
 *  for reporting it ranks as HALF_OPEN rather than as an outage. */
const severity = (breaker: CircuitBreaker): number =>
  breaker.state === "OPEN" && breaker.nextRetryIn === 0
    ? STATE_SEVERITY.HALF_OPEN
    : STATE_SEVERITY[breaker.state];

/** Lowercased, percent-decoded first segment of an upstream path. Decoding
 *  first means `/%50roposals` cannot pose as a different route from
 *  `/proposals`; malformed encoding keeps the raw text, which then simply fails
 *  the route test and lands on the shared key. */
const firstSegment = (path: string): string => {
  const [, raw = ""] = path.split("/");
  try {
    return decodeURIComponent(raw).toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
};

export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();
  /** Route keys currently holding a slot, per DAO, ordered least recently used
   *  first. A Set iterates in insertion order, so re-inserting a key on every
   *  use keeps the busiest routes at the end and the stale ones at the front. */
  private readonly routeKeysPerDao = new Map<string, Set<string>>();
  /** Route keys that have already claimed a metric name, per DAO. */
  private readonly metricNamesPerDao = new Map<string, Set<string>>();

  constructor(private readonly opts?: CircuitBreakerOptions) {}

  /** Returns the CircuitBreaker for a key, creating it lazily if needed.
   *  Keys passed here are configuration-derived (a DAO, a relayer, a service),
   *  so they report their state from the moment they exist. */
  get(key: string): CircuitBreaker {
    return this.getOrCreate(key, this.opts);
  }

  private getOrCreate(
    key: string,
    opts: CircuitBreakerOptions | undefined,
  ): CircuitBreaker {
    let breaker = this.breakers.get(key);
    if (!breaker) {
      breaker = new CircuitBreaker(key, opts);
      this.breakers.set(key, breaker);
    }
    return breaker;
  }

  /** Breaker for a route key, whose name carries a client-controlled path
   *  segment: it publishes its state gauge only once it has tripped, and only
   *  under a name the DAO's metric budget still has room for. */
  private getRoute(dao: string, key: string): CircuitBreaker {
    return this.getOrCreate(key, {
      ...this.opts,
      lazyStateMetric: true,
      resolveMetricName: () => this.claimMetricName(dao, key),
    });
  }

  /** Builds the key for a DAO API request from its upstream path: the DAO plus
   *  the first path segment when that segment reads as a route name
   *  (`ens:proposals`), and `<dao>:other` for every other shape. Nothing here
   *  knows the API's route list: a route added upstream gets its own breaker
   *  the first time it is called. */
  static proxyKey(dao: string, path: string): string {
    const segment = firstSegment(path);
    return ROUTE_SEGMENT.test(segment)
      ? `${dao}:${segment}`
      : `${dao}:${OTHER_ROUTE}`;
  }

  /** Breaker guarding a proxied request to a DAO API, keyed per DAO and route
   *  so one failing route cannot take the DAO's other routes offline, and so
   *  every caller of the same route shares one view of its health. At most
   *  `MAX_ROUTES_PER_DAO` routes hold a breaker at a time; a route arriving at
   *  a full DAO takes the slot of the least recently used reclaimable route,
   *  and shares the DAO breaker only while no slot can be freed. */
  forProxy(dao: string, path: string): CircuitBreaker {
    const key = CircuitBreakerRegistry.proxyKey(dao, path);
    const routes = this.routesFor(dao);
    if (routes.has(key)) {
      // Re-insert so the key counts as most recently used.
      routes.delete(key);
      routes.add(key);
      return this.getRoute(dao, key);
    }

    if (routes.size >= MAX_ROUTES_PER_DAO && !this.freeSlot(routes)) {
      return this.get(dao);
    }
    routes.add(key);
    return this.getRoute(dao, key);
  }

  /** Breaker guarding a fan-out call to a DAO API. Fan-out runs on a much
   *  tighter deadline than the proxy, so a slow upstream fails here while proxy
   *  calls with several times the budget still succeed: it gets its own key
   *  rather than opening the route the proxy depends on. These paths come from
   *  the gateway's own resolvers, never from a client, so they need no cap. */
  forFanOut(dao: string, path: string): CircuitBreaker {
    return this.get(`fanout:${CircuitBreakerRegistry.proxyKey(dao, path)}`);
  }

  private routesFor(dao: string): Set<string> {
    let routes = this.routeKeysPerDao.get(dao);
    if (!routes) {
      routes = new Set<string>();
      this.routeKeysPerDao.set(dao, routes);
    }
    return routes;
  }

  /** Name this route reports the state gauge under: its own while the DAO's
   *  budget has room, the shared bucket afterwards. A key that already claimed
   *  a name keeps it, so a route evicted and seen again does not spend a second
   *  slot of the budget. */
  private claimMetricName(dao: string, key: string): string {
    let names = this.metricNamesPerDao.get(dao);
    if (!names) {
      names = new Set<string>();
      this.metricNamesPerDao.set(dao, names);
    }
    if (names.has(key)) return key;
    if (names.size >= MAX_METRIC_ROUTES_PER_DAO) {
      return `${dao}:${OTHER_ROUTES_METRIC}`;
    }
    names.add(key);
    return key;
  }

  /** Frees one slot by dropping the least recently used route breaker that has
   *  nothing left to protect.
   *
   *  A breaker is reclaimable when it is idle (no call running, no failure in
   *  the live window, no failure streak) or stale (no call for a whole window,
   *  and any cooldown already elapsed). Everything else keeps its slot: a
   *  circuit inside its cooldown is shielding a failing route, and one that is
   *  counting failures or still running a call would otherwise be wiped by a
   *  client alternating made-up paths with a failing real route. Dropping a
   *  reclaimable breaker loses only history that has already expired. When no
   *  slot can be freed the caller falls back to the DAO breaker, as it did
   *  before any route had a slot. */
  private freeSlot(routes: Set<string>): boolean {
    for (const key of routes) {
      const breaker = this.breakers.get(key);
      if (breaker && !breaker.isIdle() && !breaker.isStale()) continue;
      // A stale route may be dropped while its last published state was OPEN.
      // Close its series on the way out, or the gauge would report that route
      // as open forever.
      breaker?.publishClosedOnEvict();
      routes.delete(key);
      this.breakers.delete(key);
      return true;
    }
    return false;
  }

  /** The worst-state breaker among a DAO's own key and the route breakers it
   *  currently holds (for health reporting). Only keys this registry handed out
   *  for that DAO count, so a key from another namespace (a relayer, a health
   *  probe, a fan-out) can never be read as one of its routes, whatever the DAO
   *  is called. That is also why an open fan-out or probe circuit does not show
   *  up in `/health` or `/{dao}/health`: those endpoints report what real proxy
   *  traffic sees, and a fan-out deadline or a probe failure is not that. */
  summary(key: string): CircuitBreaker {
    let worst = this.get(key);
    for (const routeKey of this.routeKeysPerDao.get(key) ?? []) {
      const breaker = this.breakers.get(routeKey);
      if (breaker && severity(breaker) > severity(worst)) worst = breaker;
    }
    return worst;
  }

  /** Returns all registered circuit breakers (for health endpoint). */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }
}
