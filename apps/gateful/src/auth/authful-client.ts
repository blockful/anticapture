import { z } from "zod";

/**
 * Authful's `/validate` response. Validated at the boundary (rather than cast)
 * so a first-party service returning an unexpected shape is treated as a failed
 * validation, never silently trusted into an auth context.
 */
export const TokenValidationSchema = z.discriminatedUnion("valid", [
  z.object({ valid: z.literal(false) }),
  z.object({
    valid: z.literal(true),
    tokenId: z.string(),
    tenant: z.string(),
    name: z.string().default("unknown"),
    rateLimitPerMin: z.number().int(),
  }),
]);

export type TokenValidation = z.infer<typeof TokenValidationSchema>;

export type TokenUsageIncrement = {
  tokenId: string;
  day: string;
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

/** Thin HTTP client for the Authful internal surface (/validate). */
export class AuthfulClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly validationApiKey: string,
    private readonly usageApiKey: string,
  ) {
    // baseUrl is normalized upstream (TOKEN_SERVICE_URL in config.ts trims
    // trailing slashes) so `${baseUrl}/validate` never produces `//validate`.
    this.baseUrl = baseUrl;
  }

  /** Throws on network/HTTP failure — the caller decides the failure policy. */
  async validate(tokenHash: string): Promise<TokenValidation> {
    const res = await fetch(`${this.baseUrl}/validate`, {
      method: "POST",
      headers: this.headers(this.validationApiKey),
      body: JSON.stringify({ tokenHash }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new AuthfulResponseError(res.status);
    return TokenValidationSchema.parse(await res.json());
  }

  async recordUsage(items: TokenUsageIncrement[]): Promise<void> {
    const res = await fetch(`${this.baseUrl}/tokens/usage`, {
      method: "POST",
      headers: this.headers(this.usageApiKey),
      body: JSON.stringify({ items }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new AuthfulResponseError(res.status);
  }

  private headers(apiKey: string) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
  }
}
