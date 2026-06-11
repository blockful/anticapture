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
    if (!res.ok) throw new Error(`authful /validate returned ${res.status}`);
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
      throw new Error(`authful /usage/batch returned ${res.status}`);
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
