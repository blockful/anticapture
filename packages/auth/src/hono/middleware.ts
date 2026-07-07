import { createMiddleware } from "hono/factory";

import { assertSecret, verifySession } from "../session.js";

export interface SiweAuthVariables {
  siweUser: {
    address: string;
  };
}

export interface SiweAuthOptions {
  secret: string;
  /** Header carrying the session token. Defaults to `x-user-token`. */
  header?: string;
}

/**
 * Hono middleware guarding routes with a SIWE-issued session token. Reads
 * the token from a custom header (NOT `Authorization` — see README for why:
 * gateful strips the `Authorization` header when proxying).
 */
export const siweAuth = (options: SiweAuthOptions) => {
  const { secret, header = "x-user-token" } = options;
  // Fail fast on a misconfigured secret. Validating here (not per request)
  // keeps the catch below scoped to token errors, so a weak secret can never
  // masquerade as a 401 `invalid_token` and hide from 5xx monitoring.
  assertSecret(secret);

  return createMiddleware<{ Variables: SiweAuthVariables }>(async (c, next) => {
    const token = c.req.header(header);

    if (!token) {
      return c.json({ error: "missing_token" }, 401);
    }

    try {
      const { address } = await verifySession(token, secret);
      c.set("siweUser", { address });
    } catch (error) {
      // hono/jwt throws named errors; `JwtTokenExpired` distinguishes an
      // expired session from an otherwise invalid one.
      const reason =
        error instanceof Error && error.name === "JwtTokenExpired"
          ? "expired_token"
          : "invalid_token";
      return c.json({ error: reason }, 401);
    }

    await next();
  });
};
