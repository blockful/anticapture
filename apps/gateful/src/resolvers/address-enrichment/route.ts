import type { OpenAPIHono } from "@hono/zod-openapi";
import { proxy } from "hono/proxy";

export function addressEnrichment(app: OpenAPIHono, upstreamUrl?: string) {
  app.all("/address-enrichment/*", async (c) => {
    if (!upstreamUrl) {
      return c.json(
        { error: "Address enrichment service not configured" },
        404,
      );
    }

    const path = c.req.path.replace(/^\/address-enrichment/, "/");
    const url = new URL(path || "/", upstreamUrl);
    url.search = new URL(c.req.url).search;

    return proxy(url.toString(), { ...c.req });
  });
}
