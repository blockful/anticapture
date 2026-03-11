import { OpenAPIHono } from "@hono/zod-openapi";
import { vi } from "vitest";

import { proxy } from "./route";

describe("proxy route", () => {
  const daoApis = new Map([
    ["uni", "http://localhost:42069"],
    ["ens", "http://localhost:42070"],
  ]);

  let app: InstanceType<typeof OpenAPIHono>;

  beforeEach(() => {
    app = new OpenAPIHono();
    proxy(app, daoApis);
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
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ data: "ok" }), { status: 200 }),
      );

    const res = await app.request("/uni/proposals?limit=10&offset=0", {
      method: "POST",
      body: "{}",
    });

    expect(res.status).toBe(200);
    expect(fetchSpy.mock.calls[0][0]).toContain("limit=10");
    expect(fetchSpy.mock.calls[0][0]).toContain("offset=0");
    expect(fetchSpy.mock.calls[0][1]!.method).toBe("POST");
  });

  it("should resolve DAO from anticapture-dao-id header", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const res = await app.request("http://localhost/", {
      headers: { "anticapture-dao-id": "uni" },
    });

    expect(res.status).toBe(200);
    expect(fetchSpy.mock.calls[0][0]).toContain("http://localhost:42069");
  });

  it("should return 400 when no DAO identifier is provided", async () => {
    const res = await app.request("/");

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Missing DAO identifier");
  });

  it("should resolve DAO case-insensitively from path", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const res = await app.request("/UNI/proposals");

    expect(res.status).toBe(200);
    expect(fetchSpy.mock.calls[0][0]).toContain("http://localhost:42069");
  });

  it("should propagate upstream error status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "internal" }), { status: 500 }),
    );

    const res = await app.request("/uni/proposals");

    expect(res.status).toBe(500);
  });
});
