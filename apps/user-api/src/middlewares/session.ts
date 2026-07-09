import { createMiddleware } from "hono/factory";

import type { AuthResolver } from "@/auth";

export type SessionUser = { id: string };

export type SessionVariables = {
  sessionUser: SessionUser;
};

export type OptionalSessionVariables = {
  sessionUser: SessionUser | null;
};

/**
 * Requires a valid better-auth session cookie. The instance is resolved per
 * request Host (fail-closed for unlisted hosts) — any instance validates any
 * session since they share the secret and database.
 */
export const sessionAuth = (resolver: AuthResolver) =>
  createMiddleware<{ Variables: SessionVariables }>(async (c, next) => {
    const auth = resolver.resolve(c.req.header("host"));
    if (!auth) return c.json({ error: "untrusted_host" }, 400);

    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session) return c.json({ error: "unauthenticated" }, 401);

    c.set("sessionUser", { id: session.user.id });
    await next();
  });

/**
 * Resolves the session when present but never rejects — for public routes
 * (shared-draft reads) that only personalize the response (isOwner).
 */
export const optionalSession = (resolver: AuthResolver) =>
  createMiddleware<{ Variables: OptionalSessionVariables }>(async (c, next) => {
    const auth = resolver.resolve(c.req.header("host"));
    const session = auth
      ? await auth.api.getSession({ headers: c.req.raw.headers })
      : null;

    c.set("sessionUser", session ? { id: session.user.id } : null);
    await next();
  });
