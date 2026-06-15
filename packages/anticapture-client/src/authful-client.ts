import { createHash } from "node:crypto";

/**
 * Minimal client for Authful's internal `/validate` surface, used by the MCP
 * HTTP server to authenticate every inbound request against the per-tenant
 * token store. Mirrors Gateful's client: only the sha256 hash of the bearer is
 * ever sent, never the plaintext.
 */
export type TokenValidation =
  | { valid: false }
  | { valid: true; tokenId: string; tenant: string; rateLimitPerMin: number };

const REQUEST_TIMEOUT_MS = 3_000;

export function hashBearerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class AuthfulClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  /** Throws on network/HTTP failure — the caller decides the failure policy. */
  async validate(tokenHash: string): Promise<TokenValidation> {
    const res = await fetch(`${this.baseUrl}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ tokenHash }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`authful /validate returned ${res.status}`);
    return (await res.json()) as TokenValidation;
  }
}
