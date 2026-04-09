import type { Context } from "hono";

/**
 * Sets a `Cache-Control: public, max-age=<seconds>` header on the response.
 *
 * Use this instead of raw `context.header("Cache-Control", ...)` to avoid
 * typos in the header value.
 */
export function setCacheControl(c: Context, seconds: number) {
  c.header("Cache-Control", `public, max-age=${seconds}`);
}
