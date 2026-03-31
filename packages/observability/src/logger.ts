import { trace } from "@opentelemetry/api";
import pino from "pino";

export type Logger = pino.Logger;

export function createLogger(service: string): Logger {
  const isDev = process.env.NODE_ENV !== "production";

  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? "info",
    mixin() {
      const span = trace.getActiveSpan();
      if (!span) return {};
      const { traceId, spanId, traceFlags } = span.spanContext();
      return { trace_id: traceId, span_id: spanId, trace_flags: traceFlags };
    },
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : {
          target: "pino-opentelemetry-transport",
          options: {
            resourceAttributes: { "service.name": service },
          },
        },
  });
}
