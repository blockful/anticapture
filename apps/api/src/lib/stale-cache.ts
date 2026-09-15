/**
 * One last-good value, kept in memory so a provider outage can be answered
 * with the previous answer instead of a 5xx.
 *
 * Deliberately a single slot rather than a map keyed by request parameters: a
 * per-parameter map is unbounded (clients choose the parameters) and pins one
 * array per distinct value forever. The max age stops an outage from serving
 * week-old data indefinitely.
 */
export class StaleValueCache<T> {
  private entry: { value: T; fetchedAt: number } | undefined;

  constructor(private readonly maxAgeMs: number) {}

  set(value: T): void {
    this.entry = { value, fetchedAt: Date.now() };
  }

  /** The last good value, or undefined when absent or older than the max age. */
  get(): T | undefined {
    if (!this.entry) return undefined;
    if (Date.now() - this.entry.fetchedAt > this.maxAgeMs) return undefined;
    return this.entry.value;
  }

  /**
   * Replaces the entry when `isBetter` says so, and always when the slot is
   * empty or expired. Without the second rule a "keep the longest" policy
   * would let a stored value go cold while shorter fetches keep succeeding.
   */
  setIf(value: T, isBetter: (current: T) => boolean): void {
    const current = this.get();
    if (current === undefined || isBetter(current)) this.set(value);
  }
}
