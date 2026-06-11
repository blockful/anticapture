import { createHash } from "node:crypto";

import type { Context, Next } from "hono";

import { logger } from "../logger.js";
import { safeParse } from "../shared/safe-parse.js";
import type { TokenfulClient, TokenValidation } from "./tokenful-client.js";

export type AuthContext = {
  tokenId: string;
  tenant: string;
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

export function hashBearerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Per-tenant token authentication backed by Tokenful.
 *
 * - Validation results are cached in Redis so tokens keep working through a
 *   Tokenful outage (positive TTL 300s; negative TTL 60s).
 * - Unknown/revoked tokens → 401 (fail-closed).
 * - Tokenful unreachable AND no cached verdict → 503 (distinguishable from
 *   bad credentials; never logs the plaintext token).
 */
export function tokenAuthMiddleware({
  client,
  cache,
  publicPaths,
}: {
  client: TokenfulClient;
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
    const cached = cachedRaw ? safeParse<TokenValidation>(cachedRaw) : null;

    const verdict = cached ?? (await validateRemote(client, tokenHash));
    if (verdict === null) {
      return c.json({ error: "Authorization service unavailable" }, 503);
    }

    if (!cached) {
      const ttl = verdict.valid ? POSITIVE_TTL_SECONDS : NEGATIVE_TTL_SECONDS;
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
      rateLimitPerMin: verdict.rateLimitPerMin,
    });
    return next();
  };
}

async function validateRemote(
  client: TokenfulClient,
  tokenHash: string,
): Promise<TokenValidation | null> {
  try {
    return await client.validate(tokenHash);
  } catch (err) {
    logger.error({ err }, "tokenful validation request failed");
    return null;
  }
}
