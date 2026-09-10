import { createMiddleware } from "hono/factory";

/**
 * Sets `Cache-Control: public, max-age=<seconds>` on 2xx responses unless the
 * handler already set the header itself (for example `no-store` on a degraded
 * response that must not be cached for the full TTL by the gateway).
 */
export function setCacheControl(seconds: number) {
  return createMiddleware(async (c, next) => {
    await next();
    if (
      c.res.status >= 200 &&
      c.res.status < 300 &&
      !c.res.headers.has("Cache-Control")
    ) {
      c.header("Cache-Control", `public, max-age=${seconds}`);
    }
  });
}
