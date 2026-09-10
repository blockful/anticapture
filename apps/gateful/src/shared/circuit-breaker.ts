import { circuitBreakerState } from "../metrics.js";

/** Marker error thrown when the circuit is OPEN — lets consumers (error handler, fan-out)
 *  distinguish "circuit rejected the call" from "upstream actually failed" via instanceof. */
export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is OPEN`);
    this.name = "CircuitOpenError";
  }
}

type State = "CLOSED" | "OPEN" | "HALF_OPEN";

const STATE_VALUE: Record<State, number> = {
  CLOSED: 0,
  HALF_OPEN: 1,
  OPEN: 2,
};

export type CircuitBreakerOptions = {
  /** Sliding window over which the failure rate is measured. */
  windowMs?: number;
  /** Requests the window must hold before the failure rate is trusted. */
  minimumRequests?: number;
  /** Failure ratio (0-1) within the window that opens the circuit. */
  failureRateThreshold?: number;
  /** Consecutive failures that open the circuit while the window holds fewer
   *  than `minimumRequests`, so low-traffic upstreams (a relayer, fan-out) can
   *  still trip on a sustained outage. */
  consecutiveFailureThreshold?: number;
  cooldownMs?: number;
  maxCooldownMs?: number;
};

/** The sliding window is split into this many fixed time buckets. */
const BUCKET_COUNT = 10;

/** Request outcomes that completed inside one time bucket. */
type Bucket = { total: number; failures: number };

/** Wraps async calls with failure tracking and automatic recovery.
 *
 *  Two rules open the circuit, depending on how much traffic the window holds:
 *
 *  - Busy keys (at least `minimumRequests` in the window) open when the
 *    failure RATE crosses the threshold. A burst of parallel calls that
 *    partially fails (a dashboard reload against a slow upstream) therefore
 *    does not trip it, while a sustained outage still does within seconds.
 *  - Quiet keys (fewer requests than the minimum) open after
 *    `consecutiveFailureThreshold` failures in a row, since a rate over a
 *    handful of samples means nothing but N straight failures still do.
 *
 *  Outcomes are counted in `BUCKET_COUNT` time buckets covering the window,
 *  so memory is bounded by the bucket count rather than by request volume.
 *
 *  After a cooldown (with exponential backoff), it transitions to HALF_OPEN and lets one probe
 *  through — if it succeeds the circuit CLOSES, otherwise it re-opens with a longer cooldown. */
export class CircuitBreaker {
  private _state: State = "CLOSED";
  /** Outcome counts keyed by bucket index (`floor(timestampMs / bucketMs)`). */
  private buckets = new Map<number, Bucket>();
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private backoffMultiplier = 1;
  private probeInFlight = false;
  private readonly _name: string;
  private readonly windowMs: number;
  private readonly bucketMs: number;
  private readonly minimumRequests: number;
  private readonly failureRateThreshold: number;
  private readonly consecutiveFailureThreshold: number;
  private readonly cooldownMs: number;
  private readonly maxCooldownMs: number;

  constructor(name: string, opts?: CircuitBreakerOptions) {
    this._name = name;
    this.windowMs = opts?.windowMs ?? 30_000;
    this.bucketMs = Math.max(1, Math.floor(this.windowMs / BUCKET_COUNT));
    this.minimumRequests = opts?.minimumRequests ?? 10;
    this.failureRateThreshold = opts?.failureRateThreshold ?? 0.5;
    this.consecutiveFailureThreshold = opts?.consecutiveFailureThreshold ?? 5;
    this.cooldownMs = opts?.cooldownMs ?? 30_000;
    this.maxCooldownMs = opts?.maxCooldownMs ?? 300_000;
    this.recordState();
  }

  get state(): State {
    return this._state;
  }

  get name(): string {
    return this._name;
  }

  /** Returns remaining ms until next probe is allowed. 0 if cooldown has passed. */
  get nextRetryIn(): number {
    if (this._state !== "OPEN") return 0;
    const elapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, this.currentCooldown() - elapsed);
  }

  private currentCooldown(): number {
    return Math.min(
      this.cooldownMs * this.backoffMultiplier,
      this.maxCooldownMs,
    );
  }

  private resetOutcomes(): void {
    this.buckets = new Map();
    this.consecutiveFailures = 0;
  }

  /** Transition to CLOSED — reset all failure tracking. */
  private closeTheCircuit(): void {
    this._state = "CLOSED";
    this.resetOutcomes();
    this.backoffMultiplier = 1;
    this.probeInFlight = false;
    this.recordState();
  }

  /** Transition to OPEN — record failure time. */
  private openTheCircuit(): void {
    this._state = "OPEN";
    this.resetOutcomes();
    this.lastFailureTime = Date.now();
    this.recordState();
  }

  private recordState(): void {
    circuitBreakerState.record(STATE_VALUE[this._state], {
      name: this._name,
    });
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    switch (this._state) {
      case "OPEN":
        this.tryTransitionToHalfOpen();
        return this.handleHalfOpen(fn);
      case "HALF_OPEN":
        return this.handleHalfOpen(fn);
      case "CLOSED":
        return this.handleClosed(fn);
    }
  }

  /** If cooldown has expired, transition to HALF_OPEN; otherwise reject. */
  private tryTransitionToHalfOpen(): void {
    const elapsed = Date.now() - this.lastFailureTime;
    if (elapsed < this.currentCooldown()) {
      throw new CircuitOpenError(this._name);
    }
    this._state = "HALF_OPEN";
    this.recordState();
    console.warn(
      `[circuit-breaker] ${this._name}: OPEN -> HALF_OPEN (cooldown expired, probing)`,
    );
  }

  /** Allow a single probe request through. Close on success, re-open on failure. */
  private async handleHalfOpen<T>(fn: () => Promise<T>): Promise<T> {
    if (this.probeInFlight) {
      throw new CircuitOpenError(this._name);
    }
    this.probeInFlight = true;
    try {
      const result = await fn();
      console.warn(
        `[circuit-breaker] ${this._name}: HALF_OPEN -> CLOSED (probe succeeded)`,
      );
      this.closeTheCircuit();
      return result;
    } catch (err) {
      this.backoffMultiplier *= 2;
      this.openTheCircuit();
      this.probeInFlight = false;
      console.warn(
        `[circuit-breaker] ${this._name}: HALF_OPEN -> OPEN (probe failed, next retry in ${this.currentCooldown()}ms)`,
      );
      throw err;
    }
  }

  /** Normal execution — track outcomes and open once a trip rule fires.
   *  The window is evaluated after every completion: with concurrent calls a
   *  success may be the one that fills the window, and settlement order must
   *  not decide whether the circuit opens. */
  private async handleClosed<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.openIfOverThreshold(this.recordOutcome(false));
      return result;
    } catch (err) {
      this.openIfOverThreshold(this.recordOutcome(true));
      throw err;
    }
  }

  private openIfOverThreshold({
    total,
    failures,
  }: {
    total: number;
    failures: number;
  }): void {
    if (total >= this.minimumRequests) {
      if (failures / total >= this.failureRateThreshold) {
        this.openTheCircuit();
        console.warn(
          `[circuit-breaker] ${this._name}: CLOSED -> OPEN (${failures}/${total} failures in the last ${this.windowMs}ms)`,
        );
      }
      return;
    }
    if (this.consecutiveFailures >= this.consecutiveFailureThreshold) {
      this.openTheCircuit();
      console.warn(
        `[circuit-breaker] ${this._name}: CLOSED -> OPEN (${this.consecutiveFailureThreshold} consecutive failures on a low-traffic upstream)`,
      );
    }
  }

  /** Counts the outcome in the current bucket, drops buckets that fell out
   *  of the window, and returns the window totals. */
  private recordOutcome(failed: boolean): { total: number; failures: number } {
    const bucketIndex = Math.floor(Date.now() / this.bucketMs);
    const oldestLiveIndex = bucketIndex - BUCKET_COUNT + 1;
    for (const index of this.buckets.keys()) {
      if (index < oldestLiveIndex) this.buckets.delete(index);
    }

    const bucket = this.buckets.get(bucketIndex) ?? { total: 0, failures: 0 };
    bucket.total += 1;
    if (failed) bucket.failures += 1;
    this.buckets.set(bucketIndex, bucket);
    this.consecutiveFailures = failed ? this.consecutiveFailures + 1 : 0;

    let total = 0;
    let failures = 0;
    for (const { total: t, failures: f } of this.buckets.values()) {
      total += t;
      failures += f;
    }
    return { total, failures };
  }
}
