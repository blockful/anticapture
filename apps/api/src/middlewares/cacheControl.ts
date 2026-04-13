import { createMiddleware } from "hono/factory";

export function setCacheControl(seconds: number) {
  return createMiddleware(async (c, next) => {
    await next();
    if (c.res.status >= 200 && c.res.status < 300) {
      c.header("Cache-Control", `public, max-age=${seconds}`);
    }
  });
}
