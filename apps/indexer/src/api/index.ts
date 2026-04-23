import {
  PROMETHEUS_MIME_TYPE,
  PrometheusSerializer,
} from "@blockful/observability";
import { Hono } from "hono/tiny";

import { exporter } from "@/metrics";

const app = new Hono();

app.get("/otel-metrics", async (c) => {
  const result = await exporter.collect();
  const serialized = new PrometheusSerializer().serialize(
    result.resourceMetrics,
  );
  return c.text(serialized, 200, {
    "Content-Type": PROMETHEUS_MIME_TYPE,
  });
});

export default app;
