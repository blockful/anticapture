import type { Meter } from "@opentelemetry/api";
import type { FastifyInstance } from "fastify";

import { createHttpServerMetrics } from "./http-metrics.js";
import {
  collectPrometheusMetrics,
  type PrometheusExporter,
} from "./prometheus.js";

export interface FastifyMetricsOptions {
  /** The exporter returned by createObservabilityProvider. */
  exporter: PrometheusExporter;
  /** Where to serve the Prometheus text format. Default `/metrics`. */
  path?: string;
  /**
   * Routes left out of the request histogram. Default: the metrics path and
   * `/health`, so the scraper and the platform health check do not dominate
   * the request rate of a low-traffic service.
   */
  skipRoutes?: string[];
  meter?: Meter;
}

/**
 * Serves Prometheus metrics and records every other request in the standard
 * `http_server_request_duration_seconds` histogram. Only types are imported
 * from fastify, so this entry adds no runtime dependency.
 */
export function registerFastifyMetrics(
  server: FastifyInstance,
  options: FastifyMetricsOptions,
): void {
  const path = options.path ?? "/metrics";
  const skipRoutes = new Set(options.skipRoutes ?? [path, "/health"]);
  const httpMetrics = createHttpServerMetrics(options.meter);

  server.get(path, async (_request, reply) => {
    const { body, contentType } = await collectPrometheusMetrics(
      options.exporter,
    );
    return reply.type(contentType).send(body);
  });

  server.addHook("onResponse", async (request, reply) => {
    // routeOptions.url is the route pattern; unmatched requests (404) have
    // none and share a single label value.
    const route = request.routeOptions.url ?? "unmatched";
    if (skipRoutes.has(route)) return;

    httpMetrics.record({
      method: request.method,
      route,
      statusCode: reply.statusCode,
      durationSeconds: reply.elapsedTime / 1000,
    });
  });
}
