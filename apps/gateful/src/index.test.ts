import { serve } from "@hono/node-server";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@hono/node-server", () => ({
  serve: vi.fn(),
}));

describe("gateful app auth", () => {
  let app: typeof import("./index.js").app;

  beforeAll(async () => {
    vi.stubEnv("BLOCKFUL_API_TOKEN", "test-token");
    vi.stubEnv("PORT", "0");
    vi.stubEnv("REDIS_URL", undefined);
    vi.stubEnv("ADDRESS_ENRICHMENT_API_URL", undefined);

    ({ app } = await import("./index.js"));
  });

  it("serves docs JSON without a bearer token", async () => {
    const res = await app.request("/docs/json");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
    });
  });

  it("serves Swagger UI without a bearer token", async () => {
    const res = await app.request("/docs");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("serves Prometheus metrics without a bearer token", async () => {
    const res = await app.request("/metrics");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("# HELP");
  });

  it("requires bearer auth outside docs endpoints", async () => {
    const res = await app.request("/votes");

    expect(res.status).toBe(401);
  });

  it("starts the HTTP server when the module is loaded", () => {
    expect(serve).toHaveBeenCalledWith({
      fetch: app.fetch,
      port: 0,
      hostname: "::",
    });
  });
});
