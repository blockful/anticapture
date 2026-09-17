import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import fastify, { type FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { registerFastifyMetrics } from "./fastify.js";

describe("registerFastifyMetrics", () => {
  const exporter = new PrometheusExporter({ preventServerStart: true });
  const meterProvider = new MeterProvider({ readers: [exporter] });
  let server: FastifyInstance;

  beforeAll(async () => {
    server = fastify();
    registerFastifyMetrics(server, {
      exporter,
      meter: meterProvider.getMeter("test"),
    });
    server.get("/health", () => ({ status: "ok" }));
    server.get("/items/:id", () => ({ ok: true }));
    server.get("/boom", () => {
      throw new Error("boom");
    });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    await meterProvider.shutdown();
  });

  it("serves Prometheus text at /metrics", async () => {
    const res = await server.inject({ method: "GET", url: "/metrics" });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
  });

  it("records requests by route pattern and status, skipping /health and /metrics", async () => {
    await server.inject({ method: "GET", url: "/items/42" });
    await server.inject({ method: "GET", url: "/boom" });
    await server.inject({ method: "GET", url: "/health" });
    await server.inject({ method: "GET", url: "/nope" });

    const { body } = await server.inject({ method: "GET", url: "/metrics" });
    const samples = body
      .split("\n")
      .filter((l) =>
        l.startsWith("http_server_request_duration_seconds_count"),
      );

    const has = (...parts: string[]) =>
      samples.some((l) => parts.every((p) => l.includes(p)));

    expect(
      has('http_route="/items/:id"', 'http_response_status_code="200"'),
    ).toBe(true);
    expect(has('http_route="/boom"', 'http_response_status_code="500"')).toBe(
      true,
    );
    expect(
      has('http_route="unmatched"', 'http_response_status_code="404"'),
    ).toBe(true);
    expect(has('http_route="/health"')).toBe(false);
    expect(has('http_route="/metrics"')).toBe(false);
    expect(has('http_route="/items/42"')).toBe(false);
  });
});
