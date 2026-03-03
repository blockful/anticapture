import { Registry, collectDefaultMetrics, Counter, Gauge } from "prom-client";

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const indexerEventsProcessed = new Counter({
  name: "indexer_events_processed_total",
  help: "Total number of blockchain events processed",
  labelNames: ["dao_id", "event_type"],
  registers: [registry],
});

export const indexerEventErrors = new Counter({
  name: "indexer_event_errors_total",
  help: "Total number of errors while processing blockchain events",
  labelNames: ["dao_id", "event_type"],
  registers: [registry],
});

export const indexerLastProcessedBlock = new Gauge({
  name: "indexer_last_processed_block",
  help: "Last blockchain block number processed by the indexer",
  labelNames: ["dao_id"],
  registers: [registry],
});
