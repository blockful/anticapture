import { OpenAPIHono } from "@hono/zod-openapi";
import { vi } from "vitest";

import { addressEnrichment } from "./route";

describe("address-enrichment route", () => {
  let app: InstanceType<typeof OpenAPIHono>;

  beforeEach(() => {
    app = new OpenAPIHono();
    addressEnrichment(app, "http://enrichment-api");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 404 when service is not configured", async () => {
    const unconfiguredApp = new OpenAPIHono();
    addressEnrichment(unconfiguredApp, undefined);

    const res = await unconfiguredApp.request("/address-enrichment/0x123");
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(404);
    expect(body.error).toContain("not configured");
  });

  it("should proxy to upstream and return its response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ens: "vitalik.eth" }), { status: 200 }),
    );

    const res = await app.request("/address-enrichment/0x123");
    const body = (await res.json()) as { ens: string };

    expect(res.status).toBe(200);
    expect(body.ens).toBe("vitalik.eth");
  });

  it("should forward query strings to upstream", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const res = await app.request(
      "/address-enrichment/0x123?include=ens&chain=1",
    );

    expect(res.status).toBe(200);
  });

  it("should propagate upstream error status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "internal" }), { status: 500 }),
    );

    const res = await app.request("/address-enrichment/0x123");

    expect(res.status).toBe(500);
  });
});
