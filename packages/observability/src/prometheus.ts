import {
  PrometheusExporter,
  PrometheusSerializer,
} from "@opentelemetry/exporter-prometheus";

export { PrometheusExporter, PrometheusSerializer };

export const PROMETHEUS_MIME_TYPE = "text/plain; version=0.0.4; charset=utf-8";

const prometheusSerializer = new PrometheusSerializer();

export async function collectPrometheusMetrics(
  exporter: PrometheusExporter,
): Promise<{ body: string; contentType: string }> {
  const result = await exporter.collect();

  return {
    body: prometheusSerializer.serialize(result.resourceMetrics),
    contentType: PROMETHEUS_MIME_TYPE,
  };
}
