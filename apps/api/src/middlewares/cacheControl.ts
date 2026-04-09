import { createMiddleware } from "hono/factory";

export function setCacheControl(seconds: number) {
  return createMiddleware(async (c, next) => {
    await next();
    c.header("Cache-Control", `public, max-age=${seconds}`);
  });
}
