import { OpenAPIHono } from "@hono/zod-openapi";
import { vi } from "vitest";

import { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry";

import { proxy } from "./route";

describe("proxy route", () => {
  const daoApis = new Map([
    ["uni", "http://localhost:42069"],
    ["ens", "http://localhost:42070"],
  ]);

  let app: InstanceType<typeof OpenAPIHono>;

  beforeEach(() => {
    app = new OpenAPIHono();
    proxy(app, daoApis, new CircuitBreakerRegistry());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 404 for unconfigured DAO", async () => {
    const res = await app.request("/unknown/proposals");

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("unknown");
  });

  it("should forward method and query strings to upstream", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: "ok" }), { status: 200 }),
    );

    const res = await app.request("/uni/proposals?limit=10&offset=0", {
      method: "POST",
      body: "{}",
    });

    expect(res.status).toBe(200);
  });

  it("should return 400 when no DAO identifier is provided", async () => {
    const res = await app.request("/");

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Use /:dao/* path");
  });

  it("should resolve DAO case-insensitively from path", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const res = await app.request("/UNI/proposals");

    expect(res.status).toBe(200);
  });

  it("should propagate upstream error status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "internal" }), { status: 500 }),
    );

    const res = await app.request("/uni/proposals");

    expect(res.status).toBe(500);
  });
});
