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
  NodeTracerProvider,
  BatchSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

export { PrometheusExporter, PrometheusSerializer };

export const PROMETHEUS_MIME_TYPE = "text/plain; version=0.0.4; charset=utf-8";

const prometheusSerializer = new PrometheusSerializer();

export interface ObservabilityProvider {
  meterProvider: MeterProvider;
  tracerProvider: NodeTracerProvider;
  exporter: PrometheusExporter;
  shutdown: () => Promise<void>;
}

export async function collectPrometheusMetrics(
  exporter: PrometheusExporter,
): Promise<{ body: string; contentType: string }> {
  const result = await exporter.collect();

  return {
    body: prometheusSerializer.serialize(result.resourceMetrics),
    contentType: PROMETHEUS_MIME_TYPE,
  };
}

export function createObservabilityProvider(
  serviceName: string,
  options?: { resourceAttributes?: Record<string, string> },
): ObservabilityProvider {
  const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    ...options?.resourceAttributes,
  });

  const prometheusExporter = new PrometheusExporter({
    preventServerStart: true,
  });

  const meterProvider = new MeterProvider({
    resource,
    readers: [prometheusExporter],
  });

  const spanProcessors = collectorEndpoint
    ? [
        new BatchSpanProcessor(
          new OTLPTraceExporter({ url: `${collectorEndpoint}/v1/traces` }),
        ),
      ]
    : [];

  const tracerProvider = new NodeTracerProvider({
    resource,
    spanProcessors,
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

  let isShuttingDown = false;
  const shutdownAndExit = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    try {
      await shutdown();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };

  process.once("SIGTERM", shutdownAndExit);
  process.once("SIGINT", shutdownAndExit);

  return {
    meterProvider,
    tracerProvider,
    exporter: prometheusExporter,
    shutdown,
  };
}
