import { trace } from "@opentelemetry/api";
import pino from "pino";

export type Logger = pino.Logger;

export function createLogger(service: string): Logger {
  const hasOtelEndpoint = !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const usePretty = !hasOtelEndpoint && process.env.NODE_ENV !== "production";

  let transport:
    | pino.TransportSingleOptions
    | pino.TransportMultiOptions
    | undefined;

  if (hasOtelEndpoint) {
    transport = {
      targets: [
        {
          target: "pino-opentelemetry-transport",
          options: {
            resourceAttributes: { "service.name": service },
          },
        },
        {
          target: "pino/file",
          options: { destination: 1 },
        },
      ],
    };
  } else if (usePretty) {
    transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    };
  }

  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? "info",
    mixin() {
      const span = trace.getActiveSpan();
      if (!span) return {};
      const { traceId, spanId, traceFlags } = span.spanContext();
      return { trace_id: traceId, span_id: spanId, trace_flags: traceFlags };
    },
    transport,
  });
}
