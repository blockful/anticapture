import { logger } from "../logger.js";

export type TokenValidation =
  | { valid: false }
  | { valid: true; tokenId: string; tenant: string; rateLimitPerMin: number };

export type UsageBatchEntry = {
  tokenId: string;
  route: string;
  hour: string; // ISO datetime, truncated to the hour
  count: number;
};

const REQUEST_TIMEOUT_MS = 3_000;

/**
 * Raised when Authful answers with a non-2xx status. Carries the status so
 * callers can distinguish a client error (4xx — the request itself is bad and
 * will never succeed on retry) from a transient server/network failure.
 */
export class AuthfulResponseError extends Error {
  constructor(readonly status: number) {
    super(`authful returned ${status}`);
    this.name = "AuthfulResponseError";
  }
}

/** Thin HTTP client for the Authful internal surface (/validate, /usage/batch). */
export class AuthfulClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  /** Throws on network/HTTP failure — the caller decides the failure policy. */
  async validate(tokenHash: string): Promise<TokenValidation> {
    const res = await fetch(`${this.baseUrl}/validate`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tokenHash }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new AuthfulResponseError(res.status);
    return (await res.json()) as TokenValidation;
  }

  /** Throws on failure — the usage tracker re-buffers and retries later. */
  async recordUsageBatch(entries: UsageBatchEntry[]): Promise<void> {
    const res = await fetch(`${this.baseUrl}/usage/batch`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ entries }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new AuthfulResponseError(res.status);
    }
    logger.debug({ entries: entries.length }, "usage batch flushed");
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }
}
