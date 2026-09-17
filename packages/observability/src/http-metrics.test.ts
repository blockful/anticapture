import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { describe, expect, it } from "vitest";

import { createHttpServerMetrics } from "./http-metrics.js";
import { collectPrometheusMetrics } from "./prometheus.js";

describe("createHttpServerMetrics", () => {
  it("records the standard histogram with the standard labels", async () => {
    const exporter = new PrometheusExporter({ preventServerStart: true });
    const meterProvider = new MeterProvider({ readers: [exporter] });
    const httpMetrics = createHttpServerMetrics(meterProvider.getMeter("test"));

    httpMetrics.record({
      method: "GET",
      route: "/items/:id",
      statusCode: 200,
      durationSeconds: 0.02,
      attributes: { client_source: "dashboard" },
    });

    const { body, contentType } = await collectPrometheusMetrics(exporter);

    expect(contentType).toContain("text/plain");
    const count = body
      .split("\n")
      .find((l) => l.startsWith("http_server_request_duration_seconds_count"));
    expect(count).toContain('http_request_method="GET"');
    expect(count).toContain('http_route="/items/:id"');
    expect(count).toContain('http_response_status_code="200"');
    expect(count).toContain('client_source="dashboard"');
    expect(count?.endsWith(" 1")).toBe(true);

    await meterProvider.shutdown();
  });
});
