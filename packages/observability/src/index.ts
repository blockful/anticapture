import {
  PrometheusExporter,
  PrometheusSerializer,
} from "@opentelemetry/exporter-prometheus";
import { HostMetrics } from "@opentelemetry/host-metrics";
import { Resource } from "@opentelemetry/resources";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

export { PrometheusExporter, PrometheusSerializer };

export const PROMETHEUS_MIME_TYPE = "text/plain; version=0.0.4; charset=utf-8";

export interface ObservabilityProvider {
  meterProvider: MeterProvider;
  exporter: PrometheusExporter;
}

export function createObservabilityProvider(
  serviceName: string,
): ObservabilityProvider {
  const exporter = new PrometheusExporter({ preventServerStart: true });

  const meterProvider = new MeterProvider({
    resource: new Resource({ [ATTR_SERVICE_NAME]: serviceName }),
    readers: [exporter],
  });

  new HostMetrics({ meterProvider, name: serviceName }).start();

  return { meterProvider, exporter };
}
