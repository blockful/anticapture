import { createHash, timingSafeEqual } from "node:crypto";

import { createMiddleware } from "hono/factory";

/**
 * Tenant prefix reserved for end-user API keys. The provisioning key (used by
 * the User API to broker keys on behalf of signed-in users) may only mint and
 * revoke tokens under this prefix — never a first-party tenant like "uniswap".
 */
export const USER_TENANT_PREFIX = "user:";

export type AuthScope = "admin" | "provisioning";

// Global context-variable typing so handlers can read c.get("authScope")
// without threading a custom Env generic through the whole app (which would
// break controllers that take the default-typed app).
declare module "hono" {
  interface ContextVariableMap {
    authScope: AuthScope;
  }
}

const digest = (value: string) => createHash("sha256").update(value).digest();

// Constant-time compare over fixed-length digests (raw strings differ in
// length, which timingSafeEqual rejects and which itself leaks length).
const safeEqual = (a: string, b: string) =>
  timingSafeEqual(digest(a), digest(b));

const bearer = (header: string | undefined): string | undefined =>
  header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

/**
 * Authenticates the token-management surface as one of two scopes:
 * - `admin`   — the full admin key; unrestricted (mint/list/revoke any tenant).
 * - `provisioning` — the optional provisioning key; restricted to `user:*`
 *   tenants and forbidden from listing (enforced by the controller via
 *   `c.get("authScope")`).
 */
export const scopedTokenAuth = (opts: {
  adminApiKey: string;
  provisioningApiKey?: string;
}) =>
  createMiddleware(async (c, next) => {
    const token = bearer(c.req.header("Authorization"));
    if (!token) return c.json({ error: "unauthorized" }, 401);

    if (safeEqual(token, opts.adminApiKey)) {
      c.set("authScope", "admin");
      return next();
    }
    if (opts.provisioningApiKey && safeEqual(token, opts.provisioningApiKey)) {
      c.set("authScope", "provisioning");
      return next();
    }
    return c.json({ error: "unauthorized" }, 401);
  });
