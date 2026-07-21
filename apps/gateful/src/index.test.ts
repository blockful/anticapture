import { serve } from "@hono/node-server";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@hono/node-server", () => ({
  serve: vi.fn(),
}));

vi.mock("./upstream-docs.js", () => ({
  storeOpenApiSpec: (ownSpec: unknown) => async () => ownSpec,
}));

describe("gateful app auth", () => {
  let app: typeof import("./index.js").app;

  beforeAll(async () => {
    vi.stubEnv("TOKEN_SERVICE_URL", "http://authful:4002");
    vi.stubEnv("TOKEN_SERVICE_API_KEY", "test-key");
    vi.stubEnv("TOKEN_SERVICE_USAGE_API_KEY", "usage-key");
    vi.stubEnv("PORT", "0");
    vi.stubEnv("REDIS_URL", undefined);
    vi.stubEnv("ADDRESS_ENRICHMENT_API_URL", undefined);
    vi.stubEnv("RAILWAY_GIT_COMMIT_SHA", "test-commit-sha");

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

  it("serves Prometheus metrics without a bearer when GATEFUL_METRICS_TOKEN is unset", async () => {
    const res = await app.request("/metrics");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("# HELP");
  });

  it("serves health with the deployed commit without a bearer token", async () => {
    const res = await app.request("/health");
    const body = (await res.json()) as {
      commit: string;
      upstreams: Record<string, unknown>;
    };

    // The configured token service (Authful) is now a probed upstream, so
    // /health reports it. No process listens on authful:4002 in tests, so the
    // probe fails and the gateway reports degraded — the key point is that
    // Authful is included in readiness rather than silently ignored.
    expect(body.commit).toBe("test-commit-sha");
    expect(body.upstreams).toHaveProperty("authful");
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

describe("metrics endpoint auth (GATEFUL_METRICS_TOKEN set)", () => {
  let app: typeof import("./index.js").app;

  beforeAll(async () => {
    vi.resetModules();
    vi.stubEnv("TOKEN_SERVICE_URL", "http://authful:4002");
    vi.stubEnv("TOKEN_SERVICE_API_KEY", "test-key");
    vi.stubEnv("TOKEN_SERVICE_USAGE_API_KEY", "usage-key");
    vi.stubEnv("GATEFUL_METRICS_TOKEN", "metrics-secret");
    vi.stubEnv("PORT", "0");
    vi.stubEnv("REDIS_URL", undefined);
    vi.stubEnv("ADDRESS_ENRICHMENT_API_URL", undefined);

    ({ app } = await import("./index.js"));
  });

  it("rejects a metrics scrape with no bearer token", async () => {
    const res = await app.request("/metrics");
    expect(res.status).toBe(401);
  });

  it("rejects a metrics scrape with the wrong bearer token", async () => {
    const res = await app.request("/metrics", {
      headers: { Authorization: "Bearer wrong-token" },
    });
    expect(res.status).toBe(401);
  });

  it("serves metrics with the correct bearer token", async () => {
    const res = await app.request("/metrics", {
      headers: { Authorization: "Bearer metrics-secret" },
    });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("# HELP");
  });
});
