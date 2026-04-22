import { createObservabilityProvider } from "@anticapture/observability";

const observability = createObservabilityProvider("anticapture-gateful");

export const exporter = observability.exporter;
export const meterProvider = observability.meterProvider;
