import { createObservabilityProvider } from "@anticapture/observability";
import type { Counter, Gauge } from "@opentelemetry/api";

const observability = createObservabilityProvider("anticapture-indexer");

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;

const meter = meterProvider.getMeter("anticapture-indexer");

export const indexerEventsProcessed: Counter = meter.createCounter(
  "indexer_events_processed_total",
  {
    description: "Total number of blockchain events processed",
  },
);

export const indexerEventErrors: Counter = meter.createCounter(
  "indexer_event_errors_total",
  {
    description: "Total number of errors while processing blockchain events",
  },
);

export const indexerLastProcessedBlock: Gauge = meter.createGauge(
  "indexer_last_processed_block",
  {
    description: "Last blockchain block number processed by the indexer",
  },
);
