import { createHash } from "node:crypto";

import type { Context, Next } from "hono";

import { logger } from "../logger.js";
import { safeParse } from "../shared/safe-parse.js";
import { TokenValidationSchema } from "./authful-client.js";
import type { TokenValidation } from "./authful-client.js";

/** Minimal Authful surface the middleware needs (matches AuthfulClient). */
export interface TokenValidator {
  validate(tokenHash: string): Promise<TokenValidation>;
}

export type AuthContext = {
  tokenId: string;
  tenant: string;
  name: string;
  rateLimitPerMin: number;
};

declare module "hono" {
  interface ContextVariableMap {
    auth?: AuthContext;
  }
}

/** Minimal Redis surface the middleware needs (matches node-redis). */
export interface TokenCacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX: number }): Promise<unknown>;
}

const POSITIVE_TTL_SECONDS = 300;
const NEGATIVE_TTL_SECONDS = 60;
// Self-service (`user:*`) keys are revocable from the dashboard, so their
// positive verdicts get a short TTL: a revoke must stop authenticating in
// seconds, not minutes. Ops tenants keep the longer outage-tolerant TTL.
const USER_POSITIVE_TTL_SECONDS = 30;

export function hashBearerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Per-tenant token authentication backed by Authful.
 *
 * - Validation results are cached in Redis so tokens keep working through a
 *   Authful outage (positive TTL 300s; negative TTL 60s).
 * - Unknown/revoked tokens → 401 (fail-closed).
 * - Authful unreachable AND no cached verdict → 503 (distinguishable from
 *   bad credentials; never logs the plaintext token).
 */
export function tokenAuthMiddleware({
  client,
  cache,
  publicPaths,
}: {
  client: TokenValidator;
  cache?: TokenCacheStore;
  publicPaths: ReadonlySet<string>;
}) {
  return async (c: Context, next: Next) => {
    if (publicPaths.has(c.req.path)) return next();

    const authHeader = c.req.header("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const tokenHash = hashBearerToken(token);
    const cacheKey = `token:${tokenHash}`;

    // Fail open on cache errors: Redis being down must not break validation.
    const cachedRaw = await cache?.get(cacheKey).catch((err: unknown) => {
      logger.warn({ err }, "token cache read failed");
      return null;
    });
    // Validate the cached shape too: a corrupted/legacy entry is treated as a
    // miss and revalidated, never trusted into an auth context.
    const cached = cachedRaw ? parseCachedVerdict(cachedRaw) : null;

    const verdict = cached ?? (await validateRemote(client, tokenHash));
    if (verdict === null) {
      return c.json({ error: "Authorization service unavailable" }, 503);
    }

    if (!cached) {
      const positiveTtl =
        verdict.valid && verdict.tenant.startsWith("user:")
          ? USER_POSITIVE_TTL_SECONDS
          : POSITIVE_TTL_SECONDS;
      const ttl = verdict.valid ? positiveTtl : NEGATIVE_TTL_SECONDS;
      await cache
        ?.set(cacheKey, JSON.stringify(verdict), { EX: ttl })
        .catch((err: unknown) => {
          logger.warn({ err }, "token cache write failed");
        });
    }

    if (!verdict.valid) return c.json({ error: "Unauthorized" }, 401);

    c.set("auth", {
      tokenId: verdict.tokenId,
      tenant: verdict.tenant,
      name: verdict.name,
      rateLimitPerMin: verdict.rateLimitPerMin,
    });
    return next();
  };
}

function parseCachedVerdict(raw: string): TokenValidation | null {
  const json = safeParse<unknown>(raw);
  if (json === null) return null;
  const result = TokenValidationSchema.safeParse(json);
  return result.success ? result.data : null;
}

async function validateRemote(
  client: TokenValidator,
  tokenHash: string,
): Promise<TokenValidation | null> {
  try {
    return await client.validate(tokenHash);
  } catch (err) {
    logger.error({ err }, "authful validation request failed");
    return null;
  }
}
