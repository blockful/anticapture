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
export interface ObservabilityProvider {
  meterProvider: MeterProvider;
  tracerProvider: NodeTracerProvider;
  exporter: PrometheusExporter;
  shutdown: () => Promise<void>;
}

const noopExporter = {
  export: (_spans: unknown[], done: (result: { code: 0 }) => void) =>
    done({ code: 0 }),
  shutdown: () => Promise.resolve(),
};

export function createObservabilityProvider(
  serviceName: string,
  /** Optional callback invoked by the SIGTERM/SIGINT handler *after* telemetry
   *  is flushed. Use it to close the HTTP server and then call process.exit()
   *  (or let Node exit naturally once all handles are closed). */
  onShutdown?: () => Promise<void>,
): ObservabilityProvider {
  const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  const resource = new Resource({ [ATTR_SERVICE_NAME]: serviceName });

  const prometheusExporter = new PrometheusExporter({
    preventServerStart: true,
  });
  const meterProvider = new MeterProvider({
    resource,
    readers: [prometheusExporter],
  });

  // Only wire up OTLP push when an endpoint is explicitly configured.
  const spanExporter = collectorEndpoint
    ? new OTLPTraceExporter({ url: `${collectorEndpoint}/v1/traces` })
    : noopExporter;

  const tracerProvider = new NodeTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(spanExporter)],
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
    // Delegate process-level cleanup (server close, process.exit, etc.) to the
    // caller. Without this hook the signal handler would return with sockets
    // still open and the process would hang until forcibly killed.
    await onShutdown?.();
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  return {
    meterProvider,
    tracerProvider,
    exporter: prometheusExporter,
    shutdown,
  };
}
