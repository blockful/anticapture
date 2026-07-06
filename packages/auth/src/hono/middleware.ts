import { createMiddleware } from "hono/factory";

import { verifySession } from "../session.js";

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
