/** Marker error thrown when the circuit is OPEN — lets consumers (error handler, fan-out)
 *  distinguish "circuit rejected the call" from "upstream actually failed" via instanceof. */
export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is OPEN`);
    this.name = "CircuitOpenError";
  }
}

type State = "CLOSED" | "OPEN" | "HALF_OPEN";

/** Wraps async calls with failure tracking and automatic recovery.
 *  After consecutive failures hit the threshold, the circuit OPENS and rejects calls instantly.
 *  After a cooldown (with exponential backoff), it transitions to HALF_OPEN and lets one probe
 *  through — if it succeeds the circuit CLOSES, otherwise it re-opens with a longer cooldown. */
export class CircuitBreaker {
  private _state: State = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private backoffMultiplier = 1;
  private probeInFlight = false;
  private readonly _name: string;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly maxCooldownMs: number;

  constructor(
    name: string,
    opts?: {
      failureThreshold?: number;
      cooldownMs?: number;
      maxCooldownMs?: number;
    },
  ) {
    this._name = name;
    this.failureThreshold = opts?.failureThreshold ?? 5;
    this.cooldownMs = opts?.cooldownMs ?? 300_000;
    this.maxCooldownMs = opts?.maxCooldownMs ?? 2_400_000;
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

  /** Transition to CLOSED — reset all failure tracking. */
  private closeTheCircuit(): void {
    this._state = "CLOSED";
    this.failureCount = 0;
    this.backoffMultiplier = 1;
    this.probeInFlight = false;
  }

  /** Transition to OPEN — record failure time. */
  private openTheCircuit(): void {
    this._state = "OPEN";
    this.lastFailureTime = Date.now();
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

  /** Normal execution — track consecutive failures and open if threshold is reached. */
  private async handleClosed<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.failureCount = 0;
      return result;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.openTheCircuit();
        console.warn(
          `[circuit-breaker] ${this._name}: CLOSED -> OPEN (${this.failureCount} consecutive failures)`,
        );
      }
      throw err;
    }
  }
}
