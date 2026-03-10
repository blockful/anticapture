import { metrics } from "@opentelemetry/api";
import {
  PrometheusExporter,
  PrometheusSerializer,
} from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HostMetrics } from "@opentelemetry/host-metrics";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { Resource } from "@opentelemetry/resources";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import {
  BatchSpanProcessor,
  NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

export { PrometheusExporter, PrometheusSerializer };

export const PROMETHEUS_MIME_TYPE = "text/plain; version=0.0.4; charset=utf-8";

export interface ObservabilityProvider {
  meterProvider: MeterProvider;
  tracerProvider: NodeTracerProvider;
  exporter: PrometheusExporter;
  shutdown: () => Promise<void>;
}

export function createObservabilityProvider(
  serviceName: string,
): ObservabilityProvider {
  const collectorEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";
  const otlpHeaders = process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? Object.fromEntries(
        process.env.OTEL_EXPORTER_OTLP_HEADERS.split(",").map(
          (h) => h.split("=", 2) as [string, string],
        ),
      )
    : undefined;

  const resource = new Resource({ [ATTR_SERVICE_NAME]: serviceName });

  const prometheusExporter = new PrometheusExporter({
    preventServerStart: true,
  });

  const meterProvider = new MeterProvider({
    resource,
    readers: [prometheusExporter],
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${collectorEndpoint}/v1/traces`,
    headers: otlpHeaders,
  });

  const tracerProvider = new NodeTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(traceExporter)],
  });

  tracerProvider.register();

  registerInstrumentations({
    tracerProvider,
    instrumentations: [new HttpInstrumentation(), new PgInstrumentation()],
  });

  metrics.setGlobalMeterProvider(meterProvider);
  new HostMetrics({ meterProvider }).start();

  const shutdown = async () => {
    await meterProvider.shutdown();
    await tracerProvider.shutdown();
  };

  return {
    meterProvider,
    tracerProvider,
    exporter: prometheusExporter,
    shutdown,
  };
}
