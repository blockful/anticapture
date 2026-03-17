import { createObservabilityProvider } from "@anticapture/observability";

const observability = createObservabilityProvider("anticapture-api");

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;
