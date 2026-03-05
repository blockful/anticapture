import { createObservabilityProvider } from "@anticapture/observability";

const observability = createObservabilityProvider("anticapture-api");

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;

const shutdown = observability.shutdown;

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});
