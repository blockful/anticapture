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

  it("should strip the tenant Authorization header before forwarding", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    await app.request("/uni/proposals", {
      headers: { Authorization: "Bearer tenant-secret" },
    });

    const forwarded = fetchSpy.mock.calls[0]?.[0] as Request;
    expect(forwarded.headers.get("authorization")).toBeNull();
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

  it("should isolate circuit breakers per DAO and route", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry = new CircuitBreakerRegistry({ minimumRequests: 2 });
    app = new OpenAPIHono();
    proxy(app, daoApis, registry);

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "internal" }), { status: 500 }),
      );

    await app.request("/uni/proposals");
    await app.request("/uni/proposals?limit=5");

    expect(registry.get("uni:proposals").state).toBe("OPEN");
    expect(registry.get("uni:votes").state).toBe("CLOSED");
    expect(registry.get("ens:proposals").state).toBe("CLOSED");

    // Other routes of the same DAO still reach upstream.
    fetchSpy.mockResolvedValue(new Response("{}", { status: 200 }));
    const res = await app.request("/uni/votes");
    expect(res.status).toBe(200);
  });
});
