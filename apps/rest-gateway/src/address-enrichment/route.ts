import type { OpenAPIHono } from "@hono/zod-openapi";

export function addressEnrichment(app: OpenAPIHono, upstreamUrl?: string) {
  app.all("/address-enrichment/*", async (c) => {
    if (!upstreamUrl) {
      return c.json(
        { error: "Address enrichment service not configured" },
        404,
      );
    }

    const path = c.req.path.replace(/^\/address-enrichment/, "");
    const url = new URL(path || "/", upstreamUrl);
    url.search = new URL(c.req.url).search;

    const res = await fetch(url.toString(), {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== "GET" ? await c.req.raw.text() : undefined,
    });

    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  });
}
