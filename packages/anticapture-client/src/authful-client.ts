import { createHash } from "node:crypto";

import { z } from "zod";

/**
 * Minimal client for Authful's internal `/validate` surface, used by the MCP
 * HTTP server to authenticate every inbound request against the per-tenant
 * token store. Mirrors Gateful's client: only the sha256 hash of the bearer is
 * ever sent, never the plaintext.
 *
 * The response is validated at the boundary (rather than cast) so an unexpected
 * shape surfaces as a failure instead of being silently trusted.
 */
export const TokenValidationSchema = z.discriminatedUnion("valid", [
  z.object({ valid: z.literal(false) }),
  z.object({
    valid: z.literal(true),
    tokenId: z.string(),
    tenant: z.string(),
    rateLimitPerMin: z.number().int(),
  }),
]);

export type TokenValidation = z.infer<typeof TokenValidationSchema>;

const REQUEST_TIMEOUT_MS = 3_000;

export function hashBearerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class AuthfulClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly apiKey: string,
  ) {
    // Trim trailing slashes so a configured URL like `https://authful/` does
    // not produce `//validate`, which Hono serves as a 404.
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

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
    return TokenValidationSchema.parse(await res.json());
  }
}
